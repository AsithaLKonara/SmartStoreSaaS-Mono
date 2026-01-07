import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

export interface PerformanceMetrics {
  timestamp: string;
  url: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface WebVitals {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  // Track API performance
  trackAPIPerformance(
    request: NextRequest,
    response: NextResponse,
    startTime: number
  ): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const metric: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      responseTime,
      statusCode: response.status,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.ip || request.headers.get('x-forwarded-for') || undefined,
      memoryUsage: process.memoryUsage(),
    };

    this.addMetric(metric);
  }

  // Track Web Vitals
  trackWebVitals(vital: WebVitals): void {
    logger.info({
      message: 'Web Vital tracked',
      context: { service: 'PerformanceMonitoring', operation: 'trackWebVitals', name: vital.name, value: vital.value }
    });
    
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(vital);
    }
  }

  // Add metric to collection
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metric.responseTime > 5000) { // 5 seconds
      logger.warn({
        message: 'Slow request detected',
        context: { service: 'PerformanceMonitoring', operation: 'trackAPI', method: metric.method, url: metric.url, responseTime: metric.responseTime }
      });
    }

    // Log errors
    if (metric.statusCode >= 400) {
      logger.error({
        message: 'API error detected',
        context: { service: 'PerformanceMonitoring', operation: 'trackAPI', method: metric.method, url: metric.url, statusCode: metric.statusCode }
      });
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalRequests: number;
    averageResponseTime: number;
    slowestRequests: PerformanceMetrics[];
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests || 0;
    const slowestRequests = [...this.metrics]
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10);
    
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100 || 0;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowestRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: process.memoryUsage(),
    };
  }

  // Get metrics for a specific time range
  getMetricsByTimeRange(startTime: Date, endTime: Date): PerformanceMetrics[] {
    return this.metrics.filter(metric => {
      const metricTime = new Date(metric.timestamp);
      return metricTime >= startTime && metricTime <= endTime;
    });
  }

  // Send to analytics service
  private sendToAnalytics(vital: WebVitals): void {
    // In a real application, you would send this to your analytics service
    // For example: Google Analytics, Mixpanel, or custom analytics endpoint
    
    if (process.env.ANALYTICS_ENDPOINT) {
      fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'web_vital',
          data: vital,
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        logger.error({
          message: 'Failed to send analytics',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { service: 'PerformanceMonitoring', operation: 'sendAnalytics' }
        });
      });
    }
  }

  // Clear old metrics
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    this.metrics = this.metrics.filter(metric => 
      new Date(metric.timestamp) > cutoffTime
    );
  }

  // Get health check data
  getHealthData(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      averageResponseTime: number;
      errorRate: number;
      memoryUsage: NodeJS.MemoryUsage;
      uptime: number;
    };
    alerts: string[];
  } {
    const summary = this.getPerformanceSummary();
    const alerts: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check response time
    if (summary.averageResponseTime > 2000) {
      alerts.push(`High average response time: ${summary.averageResponseTime}ms`);
      status = 'warning';
    }

    // Check error rate
    if (summary.errorRate > 5) {
      alerts.push(`High error rate: ${summary.errorRate}%`);
      status = 'critical';
    }

    // Check memory usage
    const memoryUsageMB = summary.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) { // 500MB
      alerts.push(`High memory usage: ${Math.round(memoryUsageMB)}MB`);
      if (status !== 'critical') status = 'warning';
    }

    return {
      status,
      metrics: {
        averageResponseTime: summary.averageResponseTime,
        errorRate: summary.errorRate,
        memoryUsage: summary.memoryUsage,
        uptime: process.uptime(),
      },
      alerts,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware wrapper for automatic performance tracking
export function withPerformanceTracking<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();

    try {
      const response = await handler(...args);
      performanceMonitor.trackAPIPerformance(request, response, startTime);
      return response;
    } catch (error) {
      // Track error responses
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      performanceMonitor.trackAPIPerformance(request, errorResponse, startTime);
      throw error;
    }
  };
}

// Web Vitals tracking function for client-side
export function trackWebVitals(vital: WebVitals): void {
  if (typeof window !== 'undefined') {
    // Send to performance monitoring endpoint
    fetch('/api/performance/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vital),
    }).catch(error => {
      logger.error({
        message: 'Failed to track web vital',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'PerformanceMonitoring', operation: 'trackWebVital', name: vital.name }
      });
    });
  }
}





import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { withErrorHandling } from '@/lib/error-handling';

export const dynamic = 'force-dynamic';

const getPerformanceDashboard = async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';
    
    // Calculate time range
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get performance data
    const summary = performanceMonitor.getPerformanceSummary();
    const healthData = performanceMonitor.getHealthData();
    const timeRangeMetrics = performanceMonitor.getMetricsByTimeRange(startTime, now);

    // Calculate additional metrics
    const responseTimePercentiles = calculatePercentiles(
      timeRangeMetrics.map(m => m.responseTime),
      [50, 75, 90, 95, 99]
    );

    const statusCodeDistribution = timeRangeMetrics.reduce((acc, metric) => {
      const status = Math.floor(metric.statusCode / 100) * 100;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const hourlyMetrics = calculateHourlyMetrics(timeRangeMetrics);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...summary,
          timeRange,
          totalRequests: timeRangeMetrics.length,
        },
        health: healthData,
        responseTimePercentiles,
        statusCodeDistribution,
        hourlyMetrics,
        topSlowestEndpoints: summary.slowestRequests.slice(0, 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get performance dashboard:', error);
    throw error;
  }
};

// Helper function to calculate percentiles
function calculatePercentiles(values: number[], percentiles: number[]): Record<string, number> {
  if (values.length === 0) return {};
  
  const sorted = [...values].sort((a, b) => a - b);
  const result: Record<string, number> = {};
  
  percentiles.forEach(percentile => {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    result[`p${percentile}`] = sorted[index] || 0;
  });
  
  return result;
}

// Helper function to calculate hourly metrics
function calculateHourlyMetrics(metrics: any[]): Array<{
  hour: string;
  requests: number;
  averageResponseTime: number;
  errors: number;
}> {
  const hourlyData = new Map<string, { requests: number; totalTime: number; errors: number }>();
  
  metrics.forEach(metric => {
    const hour = new Date(metric.timestamp).toISOString().substring(0, 13);
    const existing = hourlyData.get(hour) || { requests: 0, totalTime: 0, errors: 0 };
    
    existing.requests++;
    existing.totalTime += metric.responseTime;
    if (metric.statusCode >= 400) {
      existing.errors++;
    }
    
    hourlyData.set(hour, existing);
  });
  
  return Array.from(hourlyData.entries()).map(([hour, data]) => ({
    hour,
    requests: data.requests,
    averageResponseTime: Math.round(data.totalTime / data.requests) || 0,
    errors: data.errors,
  })).sort((a, b) => a.hour.localeCompare(b.hour));
}

export const GET = withErrorHandling(getPerformanceDashboard);
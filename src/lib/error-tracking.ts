import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { productionMonitoringService } from './production-monitoring';

export interface ErrorEvent {
  id: string;
  type: 'api_error' | 'database_error' | 'validation_error' | 'authentication_error' | 'authorization_error' | 'business_logic_error' | 'external_service_error' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stackTrace?: string;
  context: {
    userId?: string;
    organizationId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
    sessionId?: string;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
}

export interface ErrorAggregation {
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastOccurrence: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  affectedUsers: number;
  affectedOrganizations: number;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorRate: number;
  topErrors: ErrorAggregation[];
  recentErrors: ErrorEvent[];
  errorTrends: Array<{
    date: string;
    count: number;
    severity: string;
  }>;
  resolutionTime: {
    average: number;
    median: number;
    p95: number;
  };
}

export class ErrorTrackingService {
  private errorPatterns = {
    database: ['ECONNREFUSED', 'ENOTFOUND', 'timeout', 'connection', 'deadlock'],
    authentication: ['unauthorized', 'forbidden', 'invalid token', 'expired', 'authentication'],
    validation: ['validation', 'invalid', 'required', 'format', 'schema'],
    rateLimit: ['rate limit', 'too many requests', 'quota exceeded'],
    external: ['service unavailable', 'timeout', 'network error', 'api error'],
    business: ['business logic', 'constraint', 'rule violation'],
  };

  private severityRules = {
    critical: ['database', 'system'],
    high: ['authentication', 'authorization'],
    medium: ['validation', 'business'],
    low: ['rateLimit', 'external'],
  };

  /**
   * Track an error event
   */
  async trackError(error: Omit<ErrorEvent, 'id' | 'timestamp' | 'resolved' | 'tags'>): Promise<ErrorEvent> {
    try {
      const errorEvent: ErrorEvent = {
        ...error,
        id: this.generateErrorId(),
        timestamp: new Date(),
        resolved: false,
        tags: this.generateTags(error),
      };

      // Store in database
      await this.storeError(errorEvent);

      // Analyze error patterns
      await this.analyzeErrorPatterns(errorEvent);

      // Check for error spikes
      await this.checkErrorSpikes(errorEvent);

      // Update monitoring metrics
      await this.updateErrorMetrics(errorEvent);

      return errorEvent;
    } catch (error) {
      console.error('Error tracking error:', error);
      throw error;
    }
  }

  /**
   * Get error analytics for dashboard
   */
  async getErrorAnalytics(
    organizationId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date(),
    }
  ): Promise<ErrorAnalytics> {
    try {
      const whereClause = organizationId ? { organizationId } : {};
      
      // Get errors within time range
      const errors = await prisma.errorEvent.findMany({
        where: {
          ...whereClause,
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Calculate analytics
      const totalErrors = errors.length;
      
      const errorsByType = errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorsBySeverity = errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate error rate (errors per 1000 requests)
      const errorRate = await this.calculateErrorRate(organizationId, timeRange);

      // Get top errors
      const topErrors = await this.getTopErrors(organizationId, timeRange);

      // Get recent errors
      const recentErrors = errors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20)
        .map(error => ({
          id: error.id,
          type: error.type,
          severity: error.severity,
          message: error.message,
          context: error.context ? JSON.parse(error.context) : {},
          metadata: error.metadata ? JSON.parse(error.metadata) : {},
          timestamp: error.timestamp,
          resolved: error.resolved,
          resolvedAt: error.resolvedAt,
          resolvedBy: error.resolvedBy,
          tags: error.tags ? error.tags.split(',') : [],
          user: error.user,
        }));

      // Get error trends
      const errorTrends = await this.getErrorTrends(organizationId, timeRange);

      // Calculate resolution time
      const resolutionTime = await this.calculateResolutionTime(organizationId, timeRange);

      return {
        totalErrors,
        errorsByType,
        errorsBySeverity,
        errorRate,
        topErrors,
        recentErrors,
        errorTrends,
        resolutionTime,
      };
    } catch (error) {
      console.error('Error getting error analytics:', error);
      throw error;
    }
  }

  /**
   * Get error details by ID
   */
  async getErrorDetails(errorId: string): Promise<ErrorEvent | null> {
    try {
      const error = await prisma.errorEvent.findUnique({
        where: { id: errorId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!error) return null;

      return {
        id: error.id,
        type: error.type as ErrorEvent['type'],
        severity: error.severity as ErrorEvent['severity'],
        message: error.message,
        stackTrace: error.stackTrace || undefined,
        context: error.context ? JSON.parse(error.context) : {},
        metadata: error.metadata ? JSON.parse(error.metadata) : undefined,
        timestamp: error.timestamp,
        resolved: error.resolved,
        resolvedAt: error.resolvedAt || undefined,
        resolvedBy: error.resolvedBy || undefined,
        tags: error.tags ? error.tags.split(',') : [],
      };
    } catch (error) {
      console.error('Error getting error details:', error);
      throw error;
    }
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string, resolvedBy: string, resolution?: string): Promise<void> {
    try {
      await prisma.errorEvent.update({
        where: { id: errorId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
          metadata: resolution ? JSON.stringify({ resolution }) : undefined,
        },
      });
    } catch (error) {
      console.error('Error resolving error:', error);
      throw error;
    }
  }

  /**
   * Get similar errors
   */
  async getSimilarErrors(errorId: string, limit: number = 10): Promise<ErrorEvent[]> {
    try {
      const targetError = await this.getErrorDetails(errorId);
      if (!targetError) return [];

      // Find errors with similar patterns
      const similarErrors = await prisma.errorEvent.findMany({
        where: {
          AND: [
            { id: { not: errorId } },
            { type: targetError.type },
            { severity: targetError.severity },
            { message: { contains: this.extractErrorPattern(targetError.message) } },
          ],
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return similarErrors.map(error => ({
        id: error.id,
        type: error.type as ErrorEvent['type'],
        severity: error.severity as ErrorEvent['severity'],
        message: error.message,
        stackTrace: error.stackTrace || undefined,
        context: error.context ? JSON.parse(error.context) : {},
        metadata: error.metadata ? JSON.parse(error.metadata) : undefined,
        timestamp: error.timestamp,
        resolved: error.resolved,
        resolvedAt: error.resolvedAt || undefined,
        resolvedBy: error.resolvedBy || undefined,
        tags: error.tags ? error.tags.split(',') : [],
      }));
    } catch (error) {
      console.error('Error getting similar errors:', error);
      throw error;
    }
  }

  /**
   * Get error patterns and trends
   */
  async getErrorPatterns(
    organizationId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date(),
    }
  ): Promise<{
    patterns: Array<{
      pattern: string;
      count: number;
      severity: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      examples: string[];
    }>;
    trends: Array<{
      date: string;
      totalErrors: number;
      criticalErrors: number;
      resolvedErrors: number;
    }>;
  }> {
    try {
      const whereClause = organizationId ? { organizationId } : {};
      
      const errors = await prisma.errorEvent.findMany({
        where: {
          ...whereClause,
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      // Analyze patterns
      const patternMap = new Map<string, { count: number; severity: string; examples: string[] }>();
      
      errors.forEach(error => {
        const pattern = this.extractErrorPattern(error.message);
        const existing = patternMap.get(pattern) || { count: 0, severity: error.severity, examples: [] };
        existing.count++;
        existing.severity = this.getHigherSeverity(existing.severity, error.severity);
        if (existing.examples.length < 3) {
          existing.examples.push(error.message);
        }
        patternMap.set(pattern, existing);
      });

      const patterns = Array.from(patternMap.entries()).map(([pattern, data]) => ({
        pattern,
        count: data.count,
        severity: data.severity,
        trend: this.calculateTrend(pattern, timeRange),
        examples: data.examples,
      })).sort((a, b) => b.count - a.count);

      // Get trends
      const trends = await this.getErrorTrends(organizationId, timeRange);

      return { patterns, trends };
    } catch (error) {
      console.error('Error getting error patterns:', error);
      throw error;
    }
  }

  // Private helper methods

  private async storeError(error: ErrorEvent): Promise<void> {
    try {
      await prisma.errorEvent.create({
        data: {
          id: error.id,
          type: error.type,
          severity: error.severity,
          message: error.message,
          stackTrace: error.stackTrace,
          context: JSON.stringify(error.context),
          metadata: error.metadata ? JSON.stringify(error.metadata) : null,
          timestamp: error.timestamp,
          resolved: error.resolved,
          resolvedAt: error.resolvedAt,
          resolvedBy: error.resolvedBy,
          tags: error.tags.join(','),
          userId: error.context.userId,
          organizationId: error.context.organizationId,
        },
      });
    } catch (error) {
      console.error('Error storing error event:', error);
    }
  }

  private generateTags(error: Omit<ErrorEvent, 'id' | 'timestamp' | 'resolved' | 'tags'>): string[] {
    const tags: string[] = [];

    // Add type-based tags
    tags.push(error.type);

    // Add severity tag
    tags.push(error.severity);

    // Add context-based tags
    if (error.context.endpoint) {
      tags.push('api');
      const endpointParts = error.context.endpoint.split('/');
      if (endpointParts.length > 2) {
        tags.push(`endpoint:${endpointParts[1]}`);
      }
    }

    if (error.context.userId) {
      tags.push('user-error');
    }

    // Add pattern-based tags
    const message = error.message.toLowerCase();
    Object.entries(this.errorPatterns).forEach(([pattern, keywords]) => {
      if (keywords.some(keyword => message.includes(keyword))) {
        tags.push(pattern);
      }
    });

    return tags;
  }

  private extractErrorPattern(message: string): string {
    // Extract common error patterns for grouping
    const patterns = [
      /validation failed/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /timeout/i,
      /connection.*refused/i,
      /database.*error/i,
      /network.*error/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return pattern.source;
      }
    }

    // Return first few words as pattern
    return message.split(' ').slice(0, 3).join(' ').toLowerCase();
  }

  private getHigherSeverity(severity1: string, severity2: string): string {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[severity1 as keyof typeof severityLevels] > 
           severityLevels[severity2 as keyof typeof severityLevels] ? severity1 : severity2;
  }

  private async analyzeErrorPatterns(error: ErrorEvent): Promise<void> {
    // Analyze error patterns for potential issues
    const pattern = this.extractErrorPattern(error.message);
    
    // Check if this pattern has occurred frequently
    const recentPatternCount = await prisma.errorEvent.count({
      where: {
        message: { contains: pattern },
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentPatternCount > 10) {
      // Create alert for error pattern spike
      await productionMonitoringService.createAlert({
        type: 'error_rate',
        severity: 'high',
        title: 'Error Pattern Spike Detected',
        description: `Error pattern "${pattern}" has occurred ${recentPatternCount} times in the last hour`,
        organizationId: error.context.organizationId,
        service: 'error-tracking',
        metric: 'error_pattern_frequency',
        threshold: 10,
        currentValue: recentPatternCount,
        tags: ['error-pattern', 'spike'],
      });
    }
  }

  private async checkErrorSpikes(error: ErrorEvent): Promise<void> {
    // Check for overall error rate spikes
    const recentErrorCount = await prisma.errorEvent.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
        organizationId: error.context.organizationId,
      },
    });

    if (recentErrorCount > 50) {
      await productionMonitoringService.createAlert({
        type: 'error_rate',
        severity: 'critical',
        title: 'High Error Rate Detected',
        description: `${recentErrorCount} errors occurred in the last 5 minutes`,
        organizationId: error.context.organizationId,
        service: 'system',
        metric: 'error_rate',
        threshold: 50,
        currentValue: recentErrorCount,
        tags: ['error-spike', 'critical'],
      });
    }
  }

  private async updateErrorMetrics(error: ErrorEvent): Promise<void> {
    // Update monitoring metrics
    await productionMonitoringService.recordMetric({
      type: 'error',
      name: 'error_count',
      value: 1,
      unit: 'count',
      tags: {
        type: error.type,
        severity: error.severity,
        organizationId: error.context.organizationId || 'global',
      },
      organizationId: error.context.organizationId,
      metadata: {
        message: error.message,
        endpoint: error.context.endpoint,
      },
    });
  }

  private async calculateErrorRate(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<number> {
    // Simplified error rate calculation
    // In production, this would compare errors to total requests
    return 0.1; // 0.1% error rate
  }

  private async getTopErrors(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<ErrorAggregation[]> {
    try {
      const whereClause = organizationId ? { organizationId } : {};
      
      const errors = await prisma.errorEvent.findMany({
        where: {
          ...whereClause,
          timestamp: timeRange ? {
            gte: timeRange.start,
            lte: timeRange.end,
          } : undefined,
        },
      });

      // Group by type and calculate aggregations
      const typeMap = new Map<string, ErrorAggregation>();
      
      errors.forEach(error => {
        const existing = typeMap.get(error.type) || {
          type: error.type,
          count: 0,
          severity: error.severity,
          lastOccurrence: error.timestamp,
          trend: 'stable' as const,
          affectedUsers: new Set<string>(),
          affectedOrganizations: new Set<string>(),
        };
        
        existing.count++;
        existing.severity = this.getHigherSeverity(existing.severity, error.severity);
        if (error.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = error.timestamp;
        }
        
        if (error.userId) {
          existing.affectedUsers.add(error.userId);
        }
        if (error.organizationId) {
          existing.affectedOrganizations.add(error.organizationId);
        }
        
        typeMap.set(error.type, existing);
      });

      return Array.from(typeMap.values()).map(agg => ({
        ...agg,
        affectedUsers: agg.affectedUsers.size,
        affectedOrganizations: agg.affectedOrganizations.size,
      })).sort((a, b) => b.count - a.count).slice(0, 10);
    } catch (error) {
      console.error('Error getting top errors:', error);
      return [];
    }
  }

  private async getErrorTrends(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<Array<{ date: string; count: number; severity: string }>> {
    // Simplified trend calculation
    // In production, this would group by time intervals
    return [
      { date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), count: 15, severity: 'medium' },
      { date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), count: 8, severity: 'low' },
      { date: new Date().toISOString(), count: 3, severity: 'low' },
    ];
  }

  private async calculateResolutionTime(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<{ average: number; median: number; p95: number }> {
    // Simplified resolution time calculation
    return {
      average: 30, // minutes
      median: 15,
      p95: 120,
    };
  }

  private calculateTrend(pattern: string, timeRange: { start: Date; end: Date }): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    return 'stable';
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const errorTrackingService = new ErrorTrackingService();

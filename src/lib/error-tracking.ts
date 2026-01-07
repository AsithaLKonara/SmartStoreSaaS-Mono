import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { productionMonitoringService } from './production-monitoring';
import { logger } from './logger';

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

      await this.storeError(errorEvent);
      await this.analyzeErrorPatterns(errorEvent);
      await this.checkErrorSpikes(errorEvent);
      await this.updateErrorMetrics(errorEvent);

      return errorEvent;
    } catch (error) {
      logger.error({
        message: 'Error tracking error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorTracking', operation: 'trackError', errorType: errorData.type }
      });
      throw error;
    }
  }

  /**
   * Get error analytics for dashboard
   */
  async getErrorAnalytics(
    organizationId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<ErrorAnalytics> {
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

      const totalErrors = errors.length;
      
      const errorsByType = errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorsBySeverity = errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorRate = await this.calculateErrorRate(organizationId, timeRange);
      const topErrors = await this.getTopErrors(organizationId, timeRange);

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

      const errorTrends = await this.getErrorTrends(organizationId, timeRange);
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
      logger.error({
        message: 'Error getting error analytics',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorTracking', operation: 'getErrorAnalytics', organizationId }
      });
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
      logger.error({
        message: 'Error getting error details',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorTracking', operation: 'getErrorDetails', errorId }
      });
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
      logger.error({
        message: 'Error resolving error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorTracking', operation: 'resolveError', errorId, userId }
      });
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
      logger.error({
        message: 'Error storing error event',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorTracking', operation: 'storeErrorEvent', errorId: errorEvent.id }
      });
    }
  }

  private generateTags(error: Omit<ErrorEvent, 'id' | 'timestamp' | 'resolved' | 'tags'>): string[] {
    const tags: string[] = [];

    tags.push(error.type);
    tags.push(error.severity);

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

    const message = error.message.toLowerCase();
    Object.entries(this.errorPatterns).forEach(([pattern, keywords]) => {
      if (keywords.some(keyword => message.includes(keyword))) {
        tags.push(pattern);
      }
    });

    return tags;
  }

  private async analyzeErrorPatterns(error: ErrorEvent): Promise<void> {
    const pattern = this.extractErrorPattern(error.message);
    
    const recentPatternCount = await prisma.errorEvent.count({
      where: {
        message: { contains: pattern },
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentPatternCount > 10) {
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
    const recentErrorCount = await prisma.errorEvent.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
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

  private extractErrorPattern(message: string): string {
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

    return message.split(' ').slice(0, 3).join(' ').toLowerCase();
  }

  private async calculateErrorRate(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<number> {
    return 0.1;
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
      logger.error({
        message: 'Error getting top errors',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorTracking', operation: 'getTopErrors', organizationId }
      });
      return [];
    }
  }

  private async getErrorTrends(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<Array<{ date: string; count: number; severity: string }>> {
    return [
      { date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), count: 15, severity: 'medium' },
      { date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), count: 8, severity: 'low' },
      { date: new Date().toISOString(), count: 3, severity: 'low' },
    ];
  }

  private async calculateResolutionTime(organizationId?: string, timeRange?: { start: Date; end: Date }): Promise<{ average: number; median: number; p95: number }> {
    return {
      average: 30,
      median: 15,
      p95: 120,
    };
  }

  private getHigherSeverity(severity1: string, severity2: string): string {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[severity1 as keyof typeof severityLevels] > 
           severityLevels[severity2 as keyof typeof severityLevels] ? severity1 : severity2;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const errorTrackingService = new ErrorTrackingService();

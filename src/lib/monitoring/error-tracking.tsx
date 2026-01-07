import { NextRequest } from 'next/server';
import React from 'react';
import { logger } from '../logger';

export interface ErrorEvent {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'api' | 'database' | 'authentication' | 'validation';
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private maxErrors = 1000; // Keep last 1000 errors

  // Track JavaScript errors
  trackJSError(error: Error, context?: string): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      severity: this.determineSeverity(error),
      category: 'javascript',
      metadata: {
        context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    this.addError(errorEvent);
  }

  // Track API errors
  trackAPIError(
    request: NextRequest,
    error: Error,
    statusCode: number
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
      severity: this.determineSeverity(error, statusCode),
      category: 'api',
      metadata: {
        method: request.method,
        statusCode,
        ip: request.ip || request.headers.get('x-forwarded-for'),
      },
    };

    this.addError(errorEvent);
  }

  // Track database errors
  trackDatabaseError(error: Error, query?: string): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      severity: this.determineSeverity(error),
      category: 'database',
      metadata: {
        query: query?.substring(0, 500), // Limit query length
      },
    };

    this.addError(errorEvent);
  }

  // Track authentication errors
  trackAuthError(error: Error, userId?: string): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      severity: 'high',
      category: 'authentication',
      userId,
    };

    this.addError(errorEvent);
  }

  // Track validation errors
  trackValidationError(error: Error, field?: string): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      severity: 'medium',
      category: 'validation',
      metadata: {
        field,
      },
    };

    this.addError(errorEvent);
  }

  // Add error to collection
  private addError(error: ErrorEvent): void {
    this.errors.push(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log critical errors
    if (error.severity === 'critical') {
      logger.error({
        message: 'Critical error tracked',
        error: error.error instanceof Error ? error.error : new Error(String(error.error)),
        context: { service: 'ErrorTracking', operation: 'trackError', severity: error.severity, message: error.message, source: error.source }
      });
    } else if (error.severity === 'high') {
      logger.error({
        message: 'High severity error tracked',
        error: error.error instanceof Error ? error.error : new Error(String(error.error)),
        context: { service: 'ErrorTracking', operation: 'trackError', severity: error.severity, message: error.message, source: error.source }
      });
    } else {
      logger.warn({
        message: 'Error tracked',
        error: error.error instanceof Error ? error.error : new Error(String(error.error)),
        context: { service: 'ErrorTracking', operation: 'trackError', severity: error.severity, message: error.message, source: error.source }
      });
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error);
    }
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Determine error severity
  private determineSeverity(error: Error, statusCode?: number): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (error.message.includes('Database connection failed') ||
        error.message.includes('Out of memory') ||
        error.message.includes('Fatal error')) {
      return 'critical';
    }

    // High severity errors
    if (statusCode && statusCode >= 500) {
      return 'high';
    }

    if (error.message.includes('Authentication failed') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')) {
      return 'high';
    }

    // Medium severity errors
    if (statusCode && statusCode >= 400) {
      return 'medium';
    }

    // Default to low
    return 'low';
  }

  // Send to external error service
  private sendToErrorService(error: ErrorEvent): void {
    if (process.env.ERROR_SERVICE_ENDPOINT) {
      fetch(process.env.ERROR_SERVICE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      }).catch(err => {
        logger.error({
          message: 'Failed to send error to service',
          error: err instanceof Error ? err : new Error(String(err)),
          context: { service: 'ErrorTracking', operation: 'sendErrorToService', errorId: error.id }
        });
      });
    }
  }

  // Get error summary
  getErrorSummary(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorEvent[];
    errorRate: number;
  } {
    const totalErrors = this.errors.length;
    const recentErrors = this.errors.slice(-10);

    const errorsByCategory = this.errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate error rate (errors per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrorCount = this.errors.filter(
      error => new Date(error.timestamp) > oneHourAgo
    ).length;

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      recentErrors,
      errorRate: recentErrorCount,
    };
  }

  // Get errors by time range
  getErrorsByTimeRange(startTime: Date, endTime: Date): ErrorEvent[] {
    return this.errors.filter(error => {
      const errorTime = new Date(error.timestamp);
      return errorTime >= startTime && errorTime <= endTime;
    });
  }

  // Clear old errors
  clearOldErrors(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    this.errors = this.errors.filter(error => 
      new Date(error.timestamp) > cutoffTime
    );
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Client-side error tracking
export function setupClientErrorTracking(): void {
  if (typeof window === 'undefined') return;

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    errorTracker.trackJSError(event.error || new Error(event.message), 'unhandled');
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackJSError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      'unhandled-rejection'
    );
  });

  // Track fetch errors
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      if (!response.ok) {
        errorTracker.trackJSError(
          new Error(`Fetch failed: ${response.status} ${response.statusText}`),
          'fetch-error'
        );
      }
      return response;
    } catch (error) {
      errorTracker.trackJSError(error as Error, 'fetch-error');
      throw error;
    }
  };
}

// Error boundary for React components
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.trackJSError(error, 'react-error-boundary');
    logger.error({
      message: 'Error caught by boundary',
      error,
      context: { service: 'ErrorTracking', operation: 'componentDidCatch', componentStack: errorInfo.componentStack }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Something went wrong
            </h1>
            <p className="text-red-600 mb-4">
              We&apos;re sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


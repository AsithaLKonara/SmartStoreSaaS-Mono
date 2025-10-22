/**
 * Global React Error Boundary
 * 
 * Catches rendering errors in React components and:
 * 1. Displays user-friendly error UI
 * 2. Logs errors to server with correlation ID
 * 3. Provides recovery options
 * 4. Prevents white screen of death
 * 
 * Usage:
 *   <ErrorBoundary fallback={<CustomErrorUI />}>
 *     <YourApp />
 *   </ErrorBoundary>
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, correlation: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  correlation: string | null;
}

/**
 * Default error UI component
 */
function DefaultErrorFallback({
  error,
  correlation,
  onReset
}: {
  error: Error;
  correlation: string;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Something went wrong
        </h1>

        <p className="text-gray-600 text-center mb-6">
          We&apos;re sorry, but something unexpected happened. Our team has been notified.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-mono text-gray-700 break-all mb-2">
              {error.message}
            </p>
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer font-semibold mb-2">
                Stack trace
              </summary>
              <pre className="overflow-auto text-xs">{error.stack}</pre>
            </details>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Error ID: <span className="font-mono">{correlation}</span>
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Please include this ID if you contact support
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlation: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      correlation: uuidv4()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const correlation = this.state.correlation || uuidv4();

    // Update state with error info
    this.setState({
      errorInfo,
      correlation
    });

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Send error to server
    this.logErrorToServer(error, errorInfo, correlation);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, correlation);
    }
  }

  /**
   * Send error details to server for logging
   */
  private async logErrorToServer(
    error: Error,
    errorInfo: ErrorInfo,
    correlation: string
  ) {
    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlation
        },
        body: JSON.stringify({
          correlation,
          type: 'REACT_ERROR',
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          context: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (loggingError) {
      // Failed to log error to server
      console.error('Failed to log error to server:', loggingError);
    }
  }

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlation: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error!}
          correlation={this.state.correlation!}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to manually report errors
 */
export function useErrorReporter() {
  const reportError = async (
    error: Error,
    context?: Record<string, any>
  ) => {
    const correlation = uuidv4();

    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlation
        },
        body: JSON.stringify({
          correlation,
          type: 'MANUAL_REPORT',
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          context: {
            ...context,
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (loggingError) {
      console.error('Failed to report error:', loggingError);
    }

    return correlation;
  };

  return { reportError };
}

/**
 * Example usage:
 * 
 * // In your root layout or _app
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * // With custom error handler
 * <ErrorBoundary onError={(error, info, correlation) => {
 *   analytics.track('error', { correlation });
 * }}>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * // Manual error reporting
 * function MyComponent() {
 *   const { reportError } = useErrorReporter();
 *   
 *   const handleAction = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       const correlation = await reportError(error, { action: 'riskyOperation' });
 *       showToast(`Error: ${correlation}`);
 *     }
 *   };
 * }
 */

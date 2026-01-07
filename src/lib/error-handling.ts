
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code: string;
  details?: any;
  timestamp: string;
  path?: string;
  requestId?: string;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  code: string,
  status: number = 400,
  details?: any,
  path?: string,
  requestId?: string
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    success: false,
    error,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path,
    requestId,
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  const successResponse: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(successResponse, { status });
}

/**
 * Common error responses
 */
export const CommonErrors = {
  // Authentication errors
  UNAUTHORIZED: (path?: string, requestId?: string) =>
    createErrorResponse(
      'Unauthorized',
      'Authentication required',
      'AUTH_REQUIRED',
      401,
      undefined,
      path,
      requestId
    ),
  
  FORBIDDEN: (path?: string, requestId?: string) =>
    createErrorResponse(
      'Forbidden',
      'Insufficient permissions',
      'INSUFFICIENT_PERMISSIONS',
      403,
      undefined,
      path,
      requestId
    ),
  
  // Validation errors
  VALIDATION_ERROR: (details: any, path?: string, requestId?: string) =>
    createErrorResponse(
      'Validation Error',
      'Request validation failed',
      'VALIDATION_ERROR',
      400,
      details,
      path,
      requestId
    ),
  
  // Not found errors
  NOT_FOUND: (resource: string, path?: string, requestId?: string) =>
    createErrorResponse(
      'Not Found',
      `${resource} not found`,
      'NOT_FOUND',
      404,
      { resource },
      path,
      requestId
    ),
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: (retryAfter: number, path?: string, requestId?: string) =>
    createErrorResponse(
      'Too Many Requests',
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter },
      path,
      requestId
    ),
  
  // Server errors
  INTERNAL_ERROR: (path?: string, requestId?: string) =>
    createErrorResponse(
      'Internal Server Error',
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      500,
      undefined,
      path,
      requestId
    ),
  
  SERVICE_UNAVAILABLE: (service: string, path?: string, requestId?: string) =>
    createErrorResponse(
      'Service Unavailable',
      `${service} service is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      { service },
      path,
      requestId
    ),
  
  // Bad request errors
  BAD_REQUEST: (message: string, details?: any, path?: string, requestId?: string) =>
    createErrorResponse(
      'Bad Request',
      message,
      'BAD_REQUEST',
      400,
      details,
      path,
      requestId
    ),
  
  // Conflict errors
  CONFLICT: (message: string, details?: any, path?: string, requestId?: string) =>
    createErrorResponse(
      'Conflict',
      message,
      'CONFLICT',
      409,
      details,
      path,
      requestId
    ),
};

/**
 * Zod validation wrapper with error handling
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, request: Request) => Promise<NextResponse>
) {
  return async function (request: Request): Promise<NextResponse> {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return handler(validatedData, request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return CommonErrors.VALIDATION_ERROR(
          {
            issues: error.issues,
            formErrors: error.formErrors,
            fieldErrors: error.fieldErrors,
          },
          request.url,
          generateRequestId()
        );
      }
      
      if (error instanceof SyntaxError) {
        return CommonErrors.BAD_REQUEST(
          'Invalid JSON payload',
          { error: error.message },
          request.url,
          generateRequestId()
        );
      }
      
      logger.error({
        message: 'Validation error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorHandling', operation: 'validateRequest', url: request.url }
      });
      return CommonErrors.INTERNAL_ERROR(request.url, generateRequestId());
    }
  };
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request path for error responses
 */
export function getRequestPath(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.pathname;
  } catch {
    return 'unknown';
  }
}

/**
 * Error handling middleware wrapper
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async function (...args: T): Promise<R | NextResponse> {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error({
        message: 'Handler error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'ErrorHandling', operation: 'withErrorHandler' }
      });
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          return CommonErrors.VALIDATION_ERROR(
            { error: error.message },
            args[0]?.url || 'unknown',
            generateRequestId()
          );
        }
        
        if (error.message.includes('not found')) {
          return CommonErrors.NOT_FOUND(
            'Resource',
            args[0]?.url || 'unknown',
            generateRequestId()
          );
        }
        
        if (error.message.includes('unauthorized')) {
          return CommonErrors.UNAUTHORIZED(
            args[0]?.url || 'unknown',
            generateRequestId()
          );
        }
      }
      
      // Default to internal error
      return CommonErrors.INTERNAL_ERROR(
        args[0]?.url || 'unknown',
        generateRequestId()
      );
    }
  };
}

/**
 * Async error boundary for route handlers
 */
export function asyncErrorBoundary<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async function (...args: T): Promise<R | NextResponse> {
    try {
      return await handler(...args);
    } catch (error) {
      const path = getRequestPath(args[0] as Request);
      const requestId = generateRequestId();
      
      // Log error with context
      logger.error({
        message: 'Route handler error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          service: 'ErrorHandling',
          operation: 'asyncErrorBoundary',
          path,
          requestId,
          errorMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      });
      
      // Return appropriate error response
      if (error instanceof z.ZodError) {
        return CommonErrors.VALIDATION_ERROR(
          { issues: error.issues },
          path,
          requestId
        );
      }
      
      if (error instanceof SyntaxError) {
        return CommonErrors.BAD_REQUEST(
          'Invalid JSON payload',
          { error: error.message },
          path,
          requestId
        );
      }
      
      // Check for specific error types
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        return CommonErrors.SERVICE_UNAVAILABLE(
          'Database',
          path,
          requestId
        );
      }
      
      if (errorMessage.includes('timeout')) {
        return CommonErrors.SERVICE_UNAVAILABLE(
          'Service',
          path,
          requestId
        );
      }
      
      // Default internal error
      return CommonErrors.INTERNAL_ERROR(path, requestId);
    }
  };
}

/**
 * Validate request method
 */
export function validateMethod(allowedMethods: string[]) {
  return function (request: Request): NextResponse | null {
    if (!allowedMethods.includes(request.method)) {
      return CommonErrors.BAD_REQUEST(
        `Method ${request.method} not allowed`,
        { allowedMethods },
        getRequestPath(request),
        generateRequestId()
      );
    }
    return null;
  };
}

/**
 * Check required headers
 */
export function requireHeaders(requiredHeaders: string[]) {
  return function (request: Request): NextResponse | null {
    const missingHeaders = requiredHeaders.filter(
      header => !request.headers.get(header)
    );
    
    if (missingHeaders.length > 0) {
      return CommonErrors.BAD_REQUEST(
        'Missing required headers',
        { missingHeaders },
        getRequestPath(request),
        generateRequestId()
      );
    }
    
    return null;
  };
}
/**
 * Global API Error Handler Middleware
 * 
 * Wraps API route handlers to:
 * 1. Catch all unhandled exceptions
 * 2. Log errors with structured format and correlation ID
 * 3. Return standardized error responses
 * 4. Prevent error details from leaking to clients
 * 
 * Usage:
 *   export default withErrorHandler(async (req, res, { correlation }) => {
 *     // Your handler logic
 *   });
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export interface ErrorContext {
  correlation: string;
  userId?: string;
  organizationId?: string;
  role?: string;
}

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: ErrorContext
) => Promise<void> | void;

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  code: 'ERR_VALIDATION' | 'ERR_AUTH' | 'ERR_INTERNAL' | 'ERR_NOT_FOUND' | 'ERR_FORBIDDEN';
  message: string;
  correlation: string;
  details?: Record<string, any>;
}

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorResponse['code'],
    public statusCode: number,
    public exposeMessage: boolean = true,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERR_VALIDATION', 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'ERR_AUTH', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'ERR_FORBIDDEN', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'ERR_NOT_FOUND', 404, true);
  }
}

/**
 * Extract or generate correlation ID from request
 */
function getCorrelationId(req: NextApiRequest): string {
  // Check header (X-Request-ID or X-Correlation-ID)
  const headerCorrelation =
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'];

  if (headerCorrelation) {
    return Array.isArray(headerCorrelation)
      ? headerCorrelation[0]
      : headerCorrelation;
  }

  // Generate new correlation ID
  return uuidv4();
}

/**
 * Build error context from request
 */
function buildErrorContext(
  req: NextApiRequest,
  correlation: string
): Record<string, any> {
  return {
    correlation,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.id,
    organizationId: (req as any).user?.organizationId,
    role: (req as any).user?.role,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    timestamp: new Date().toISOString()
  };
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
function sanitizeError(error: any): any {
  const sanitized: any = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode
  };

  // Include stack trace in non-production
  if (process.env.NODE_ENV !== 'production') {
    sanitized.stack = error.stack
      ?.split('\n')
      .slice(0, 10)
      .join('\n');
  }

  // Include custom details if present
  if (error.details) {
    sanitized.details = error.details;
  }

  return sanitized;
}

/**
 * Map error to HTTP status code
 */
function getStatusCode(error: any): number {
  // AppError has statusCode
  if (error.statusCode) {
    return error.statusCode;
  }

  // Prisma errors
  if (error.code === 'P2002') return 409; // Unique constraint
  if (error.code === 'P2025') return 404; // Record not found
  if (error.code?.startsWith('P')) return 400; // Other Prisma errors

  // Default to 500
  return 500;
}

/**
 * Map error to error code
 */
function getErrorCode(error: any): ErrorResponse['code'] {
  if (error.code === 'ERR_VALIDATION') return 'ERR_VALIDATION';
  if (error.code === 'ERR_AUTH') return 'ERR_AUTH';
  if (error.code === 'ERR_FORBIDDEN') return 'ERR_FORBIDDEN';
  if (error.code === 'ERR_NOT_FOUND') return 'ERR_NOT_FOUND';
  return 'ERR_INTERNAL';
}

/**
 * Get client-safe error message
 */
function getClientMessage(error: any): string {
  // AppError with exposeMessage = true
  if (error instanceof AppError && error.exposeMessage) {
    return error.message;
  }

  // Prisma errors
  if (error.code === 'P2002') {
    return 'A record with this value already exists';
  }
  if (error.code === 'P2025') {
    return 'The requested resource was not found';
  }

  // Generic message for production
  if (process.env.NODE_ENV === 'production') {
    return 'An internal error occurred';
  }

  // Development: expose actual error
  return error.message || 'An internal error occurred';
}

/**
 * Main error handler middleware
 */
export function withErrorHandler(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const correlation = getCorrelationId(req);

    // Attach correlation ID to response header
    // Note: In Next.js App Router, headers are set differently
    // These headers will be set by the NextResponse constructor

    try {
      // Build context
      const context: ErrorContext = {
        correlation,
        userId: (req as any).user?.id,
        organizationId: (req as any).user?.organizationId,
        role: (req as any).user?.role
      };

      // Execute handler
      await handler(req, res, context);
    } catch (error: any) {
      // Build error context for logging
      const errorContext = buildErrorContext(req, correlation);

      // Log error with full context
      logger.error({
        message: 'API request failed',
        error: sanitizeError(error),
        context: errorContext
      });

      // Determine status code and error code
      const statusCode = getStatusCode(error);
      const errorCode = getErrorCode(error);
      const clientMessage = getClientMessage(error);

      // Build error response
      const errorResponse: ErrorResponse = {
        success: false,
        code: errorCode,
        message: clientMessage,
        correlation
      };

      // Include details in development or for validation errors
      if (
        process.env.NODE_ENV !== 'production' ||
        error instanceof ValidationError
      ) {
        errorResponse.details = error.details;
      }

      // Send error response
      if (!res.headersSent) {
        res.status(statusCode).json(errorResponse);
      }
    }
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, any>
): { success: true; data: T; meta?: Record<string, any> } {
  return {
    success: true,
    data,
    ...(meta && { meta })
  };
}

/**
 * Example usage:
 * 
 * export default withErrorHandler(async (req, res, { correlation }) => {
 *   const { id } = req.query;
 *   
 *   // Validation
 *   if (!id) {
 *     throw new ValidationError('Missing required parameter: id');
 *   }
 *   
 *   // Authorization
 *   if (!req.user) {
 *     throw new AuthenticationError();
 *   }
 *   
 *   // Business logic
 *   const product = await prisma.product.findUnique({
 *     where: { id: String(id) }
 *   });
 *   
 *   if (!product) {
 *     throw new NotFoundError('Product not found');
 *   }
 *   
 *   // Success
 *   res.json(successResponse(product));
 * });
 */


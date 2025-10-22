/**
 * Global API Error Handler Middleware for App Router
 * 
 * Wraps API route handlers to:
 * 1. Catch all unhandled exceptions
 * 2. Log errors with structured format and correlation ID
 * 3. Return standardized error responses
 * 4. Prevent error details from leaking to clients
 * 
 * Usage:
 *   export const GET = withErrorHandlerApp(async (req) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export interface ErrorContext {
  correlation: string;
  userId?: string;
  organizationId?: string;
  role?: string;
}

export type AppApiHandler = (
  req: NextRequest,
  context: ErrorContext
) => Promise<NextResponse>;

function getCorrelationId(req: NextRequest): string {
  // Check for existing correlation ID in headers
  const existingId = req.headers.get('x-request-id') || 
                    req.headers.get('x-correlation-id');
  
  if (existingId) {
    return existingId;
  }
  
  // Generate new correlation ID
  return uuidv4();
}

function getUserId(req: NextRequest): string | undefined {
  // Extract user ID from headers or JWT token
  return req.headers.get('x-user-id') || undefined;
}

function getOrganizationId(req: NextRequest): string | undefined {
  // Extract organization ID from headers
  return req.headers.get('x-organization-id') || undefined;
}

function getRole(req: NextRequest): string | undefined {
  // Extract role from headers
  return req.headers.get('x-user-role') || undefined;
}

export function successResponse(data: any, meta?: any): NextResponse {
  const response = {
    success: true,
    data,
    ...(meta && { meta })
  };
  
  return NextResponse.json(response);
}

export function errorResponse(
  message: string,
  code: string = 'ERR_INTERNAL',
  status: number = 500,
  details?: any,
  correlation?: string
): NextResponse {
  const response = {
    success: false,
    code,
    message,
    correlation: correlation || uuidv4(),
    ...(details && { details })
  };
  
  return NextResponse.json(response, { status });
}

export function withErrorHandlerApp(handler: AppApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const correlation = getCorrelationId(req);
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const role = getRole(req);
    
    const context: ErrorContext = {
      correlation,
      userId,
      organizationId,
      role
    };
    
    try {
      // Add correlation ID to response headers
      const response = await handler(req, context);
      
      // Add correlation ID to response headers
      response.headers.set('X-Request-Id', correlation);
      
      return response;
    } catch (error: any) {
      // Log the error with structured format
      logger.error({
        message: error.message || 'Unhandled API error',
        error: error.stack,
        context: {
          userId,
          organizationId,
          role,
          correlation,
          url: req.url,
          method: req.method,
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        },
        correlation,
        timestamp: new Date().toISOString()
      });
      
      // Return standardized error response
      return errorResponse(
        'An unexpected error occurred. Please try again later.',
        'ERR_INTERNAL',
        500,
        process.env.NODE_ENV === 'development' ? {
          error: error.message,
          stack: error.stack
        } : undefined,
        correlation
      );
    }
  };
}

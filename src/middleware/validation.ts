import { NextRequest, NextResponse } from 'next/server';
import { ValidationUtils, withValidation } from '@/lib/validation';
import { logger } from '@/lib/logger';

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, number[]>();

// Rate limiting middleware
export function rateLimitMiddleware(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  return (request: NextRequest): NextResponse | null => {
    const identifier = getClientIdentifier(request);

    if (!ValidationUtils.validateRateLimit(identifier, windowMs, maxRequests, rateLimitStore)) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: windowMs / 1000 },
        { status: 429, headers: { 'Retry-After': (windowMs / 1000).toString() } }
      );
    }

    return null;
  };
}

// Input sanitization middleware
export function sanitizationMiddleware(request: NextRequest): NextResponse | null {
  try {
    // Check for suspicious patterns in URL
    const url = request.url;

    // Check for SQL injection patterns
    if (!ValidationUtils.validateSQLInjection(url)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Check for XSS patterns
    if (!ValidationUtils.validateXSS(url)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Sanitization middleware error',
      error: error,
      context: { url: request.url, method: request.method }
    });
    return NextResponse.json(
      { error: 'Request validation failed' },
      { status: 400 }
    );
  }
}

// API key validation middleware
export function apiKeyMiddleware(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    );
  }

  if (!ValidationUtils.validateAPIKey(apiKey)) {
    return NextResponse.json(
      { error: 'Invalid API key format' },
      { status: 401 }
    );
  }

  // In production, validate against database
  // const isValid = await validateAPIKeyInDatabase(apiKey);
  // if (!isValid) {
  //   return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  // }

  return null;
}

// Request size validation middleware
export function requestSizeMiddleware(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (request: NextRequest): NextResponse | null => {
    const contentLength = request.headers.get('content-length');

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    return null;
  };
}

// Content type validation middleware
export function contentTypeMiddleware(allowedTypes: string[] = ['application/json']) {
  return (request: NextRequest): NextResponse | null => {
    const contentType = request.headers.get('content-type');

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!contentType) {
        return NextResponse.json(
          { error: 'Content-Type header required' },
          { status: 400 }
        );
      }

      const isValidType = allowedTypes.some(type =>
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isValidType) {
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 415 }
        );
      }
    }

    return null;
  };
}

// CORS validation middleware
export function corsMiddleware(
  allowedOrigins: string[] = ['http://localhost:3003'],
  allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: string[] = ['Content-Type', 'Authorization', 'X-API-Key']
) {
  return (request: NextRequest): NextResponse | null => {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = NextResponse.next();

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }

      response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      response.headers.set('Access-Control-Max-Age', '86400');

      return response;
    }

    // Validate origin for actual requests
    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    return null;
  };
}

// Security headers middleware
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

// Request logging middleware
export function loggingMiddleware(request: NextRequest): NextResponse {
  const startTime = Date.now();
  const identifier = getClientIdentifier(request);

  logger.info({
    message: 'Incoming request',
    context: {
      method: request.method,
      url: request.url,
      identifier,
      timestamp: new Date().toISOString()
    }
  });

  const response = NextResponse.next();

  // Log response time
  const endTime = Date.now();
  const duration = endTime - startTime;

  logger.info({
    message: 'Request completed',
    context: {
      status: response.status,
      duration,
      timestamp: new Date().toISOString()
    }
  });

  return response;
}

// Error handling middleware
export function errorHandlingMiddleware(
  error: Error,
  request: NextRequest
): NextResponse {
  logger.error({
    message: 'Middleware error',
    error: error,
    context: {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    }
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  return NextResponse.json(
    {
      error: 'Internal server error',
      message: isDevelopment ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
      path: request.url
    },
    { status: 500 }
  );
}

// Validation chain middleware
export function createValidationChain(middlewares: Array<(request: NextRequest) => NextResponse | null>) {
  return (request: NextRequest): NextResponse | null => {
    for (const middleware of middlewares) {
      const result = middleware(request);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

// Utility functions
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  const ip = forwarded?.split(',')[0] || realIP || clientIP || 'unknown';

  // In production, you might want to use user ID or API key
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return `${ip}-${userAgent}`;
}

// Export validation middleware factory
export function createValidationMiddleware(options: {
  rateLimit?: {
    windowMs?: number;
    maxRequests?: number;
  };
  requestSize?: number;
  allowedContentTypes?: string[];
  cors?: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
  };
  security?: boolean;
  logging?: boolean;
}) {
  const middlewares: Array<(request: NextRequest) => NextResponse | null> = [];

  // Add sanitization middleware
  middlewares.push(sanitizationMiddleware);

  // Add rate limiting
  if (options.rateLimit) {
    middlewares.push(
      rateLimitMiddleware(
        options.rateLimit.windowMs,
        options.rateLimit.maxRequests
      )
    );
  }

  // Add request size validation
  if (options.requestSize) {
    middlewares.push(requestSizeMiddleware(options.requestSize));
  }

  // Add content type validation
  if (options.allowedContentTypes) {
    middlewares.push(contentTypeMiddleware(options.allowedContentTypes));
  }

  // Add CORS validation
  if (options.cors) {
    middlewares.push(
      corsMiddleware(
        options.cors.allowedOrigins,
        options.cors.allowedMethods,
        options.cors.allowedHeaders
      )
    );
  }

  return createValidationChain(middlewares);
}

// All middleware functions are exported individually above



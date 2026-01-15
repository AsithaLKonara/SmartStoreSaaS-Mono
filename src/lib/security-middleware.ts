import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
}

export function withRateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  return function rateLimitMiddleware(handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      // Generate rate limit key
      const key = keyGenerator
        ? keyGenerator(request)
        : request.ip || 'unknown';

      const now = Date.now();
      const windowStart = now - windowMs;

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired one
        entry = {
          count: 0,
          resetTime: now + windowMs
        };
      }

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        return NextResponse.json(
          {
            success: false,
            message: 'Rate limit exceeded',
            error: 'Too many requests',
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': entry.resetTime.toString()
            }
          }
        );
      }

      // Increment counter
      entry.count++;
      rateLimitStore.set(key, entry);

      // Continue with the request
      const response = await handler(request, ...args);

      // Add rate limit headers to response
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
        response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
      }

      return response;
    };
  };
}

// Input validation middleware
export function withInputValidation(schema: any) {
  return function validationMiddleware(handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      try {
        // Only validate POST, PUT, PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const body = await request.json();

          // Validate against schema
          const result = schema.safeParse(body);

          if (!result.success) {
            return NextResponse.json(
              {
                success: false,
                message: 'Validation failed',
                errors: result.error.errors.map(err => ({
                  field: err.path.join('.'),
                  message: err.message
                }))
              },
              { status: 400 }
            );
          }
        }

        // Continue with validated request
        return handler(request, ...args);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid request body',
            error: 'Request body must be valid JSON'
          },
          { status: 400 }
        );
      }
    };
  };
}

// Security headers middleware
export function withSecurityHeaders(handler: Function) {
  return async function (request: NextRequest, ...args: any[]) {
    const response = await handler(request, ...args);

    if (response instanceof NextResponse) {
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      // Content Security Policy
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
      );
    }

    return response;
  };
}

// CORS middleware
export function withCORS(handler: Function) {
  return async function (request: NextRequest, ...args: any[]) {
    const response = await handler(request, ...args);

    if (response instanceof NextResponse) {
      const origin = request.headers.get('origin');
      const allowedOrigins = [
        'http://localhost:3003',
        'http://localhost:3001',
        'https://smartstore-saas.vercel.app'
      ];

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }

      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    return response;
  };
}

// Combine multiple middleware
export function withSecurity(config?: {
  rateLimit?: RateLimitConfig;
  validation?: any;
  cors?: boolean;
  headers?: boolean;
}) {
  return function securityMiddleware(handler: Function) {
    let wrappedHandler = handler;

    // Apply rate limiting
    if (config?.rateLimit) {
      wrappedHandler = withRateLimit(config.rateLimit)(wrappedHandler);
    }

    // Apply input validation
    if (config?.validation) {
      wrappedHandler = withInputValidation(config.validation)(wrappedHandler);
    }

    // Apply CORS
    if (config?.cors) {
      wrappedHandler = withCORS(wrappedHandler);
    }

    // Apply security headers
    if (config?.headers) {
      wrappedHandler = withSecurityHeaders(wrappedHandler);
    }

    return wrappedHandler;
  };
}

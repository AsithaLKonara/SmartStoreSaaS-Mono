import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { logger } from './logger';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit configurations
export const RATE_LIMITS = {
  // Public endpoints - stricter limits
  public: {
    window: 60, // 1 minute
    max: 30,    // 30 requests per minute
  },
  // Authenticated endpoints - more generous
  authenticated: {
    window: 60, // 1 minute
    max: 100,   // 100 requests per minute
  },
  // Admin endpoints - very generous
  admin: {
    window: 60, // 1 minute
    max: 200,   // 200 requests per minute
  },
  // Auth endpoints - prevent brute force
  auth: {
    window: 300, // 5 minutes
    max: 5,      // 5 attempts per 5 minutes
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(request: Request): string {
  // Try to get user ID from auth header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Extract user ID from JWT token (simplified)
    try {
      const token = authHeader.slice(7);
      // In production, decode JWT to get user ID
      // For now, use a hash of the token
      return `user:${Buffer.from(token).toString('base64').slice(0, 16)}`;
    } catch {
      // Fall back to IP if token parsing fails
    }
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
  return `ip:${ip}`;
}

/**
 * Check rate limit for a client
 */
export async function checkRateLimit(
  request: Request,
  type: RateLimitType = 'public'
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}> {
  const clientId = getClientId(request);
  const config = RATE_LIMITS[type];
  const key = `rate_limit:${type}:${clientId}`;
  
  try {
    // Get current count and window info
    const current = await redis.get(key);
    const now = Math.floor(Date.now() / 1000);
    
    if (!current) {
      // First request in this window
      await redis.setex(key, config.window, 1);
      return {
        success: true,
        limit: config.max,
        remaining: config.max - 1,
        reset: now + config.window,
        retryAfter: 0,
      };
    }
    
    const count = current as number;
    
    if (count >= config.max) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key);
      return {
        success: false,
        limit: config.max,
        remaining: 0,
        reset: now + ttl,
        retryAfter: ttl,
      };
    }
    
    // Increment counter
    await redis.incr(key);
    
    return {
      success: true,
      limit: config.max,
      remaining: config.max - count - 1,
      reset: now + config.window,
      retryAfter: 0,
    };
    
  } catch (error) {
    logger.error({
      message: 'Rate limiting error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'RateLimit', operation: 'checkRateLimit', identifier }
    });
    // On Redis error, allow request (fail open for availability)
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      reset: now + config.window,
      retryAfter: 0,
    };
  }
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: Request,
  type: RateLimitType = 'public'
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, type);
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.reset),
          'Retry-After': String(result.retryAfter),
        },
      }
    );
  }
  
  return null; // Continue with request
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(type: RateLimitType = 'public') {
  return function <T extends any[], R>(
    handler: (...args: T) => Promise<R>
  ) {
    return async function (request: Request, ...args: T): Promise<R | NextResponse> {
      const rateLimitResult = await applyRateLimit(request, type);
      if (rateLimitResult) {
        return rateLimitResult;
      }
      
      return handler(request, ...args);
    };
  };
}

/**
 * Get rate limit info for a client (useful for debugging)
 */
export async function getRateLimitInfo(
  request: Request,
  type: RateLimitType = 'public'
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
  window: number;
}> {
  const clientId = getClientId(request);
  const config = RATE_LIMITS[type];
  const key = `rate_limit:${type}:${clientId}`;
  
  try {
    const current = await redis.get(key);
    const ttl = await redis.ttl(key);
    const count = (current as number) || 0;
    
    return {
      limit: config.max,
      remaining: Math.max(0, config.max - count),
      reset: Math.floor(Date.now() / 1000) + ttl,
      window: config.window,
    };
  } catch (error) {
    logger.error({
      message: 'Error getting rate limit info',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'RateLimit', operation: 'getRateLimitInfo', identifier }
    });
    return {
      limit: config.max,
      remaining: config.max,
      reset: 0,
      window: config.window,
    };
  }
}

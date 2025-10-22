/**
 * Rate Limiting System
 * Simple in-memory rate limiter (use Redis in production)
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production)
const store = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries
 */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanup, 60000);

/**
 * Check rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const resetAt = now + config.windowMs;
    store.set(identifier, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Increment counter
  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit tiers
 */
export const RateLimitTiers = {
  FREE: { windowMs: 60000, maxRequests: 60 }, // 60 per minute
  BASIC: { windowMs: 60000, maxRequests: 300 }, // 300 per minute
  PRO: { windowMs: 60000, maxRequests: 1000 }, // 1000 per minute
  ENTERPRISE: { windowMs: 60000, maxRequests: 5000 }, // 5000 per minute
};

/**
 * Get rate limit config for tier
 */
export function getRateLimitForTier(tier: keyof typeof RateLimitTiers): RateLimitConfig {
  return RateLimitTiers[tier] || RateLimitTiers.FREE;
}


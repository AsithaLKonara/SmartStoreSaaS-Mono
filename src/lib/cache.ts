import Redis from 'ioredis';

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  organization: (id: string) => `org:${id}`,
  product: (id: string) => `product:${id}`,
  order: (id: string) => `order:${id}`,
  customer: (id: string) => `customer:${id}`,
  settings: (orgId: string) => `settings:${orgId}`,
  analytics: (orgId: string, type: string, period: string) => `analytics:${type}:${orgId}:${period}`,
  inventory: (orgId: string, productId: string) => `inventory:${orgId}:${productId}`,
  courier: (orgId: string, orderId: string) => `courier:${orgId}:${orderId}`,
  whatsapp: (orgId: string, messageId: string) => `whatsapp:${orgId}:${messageId}`,
};

// Cache operations
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    return false;
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}

export async function cacheIncrement(key: string, value: number = 1): Promise<number> {
  try {
    return await redis.incrby(key, value);
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
}

export async function cacheExpire(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const result = await redis.expire(key, ttlSeconds);
    return result === 1;
  } catch (error) {
    console.error('Cache expire error:', error);
    return false;
  }
}

// Cache invalidation helpers
export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheDelete(cacheKeys.user(userId));
}

export async function invalidateOrganizationCache(organizationId: string): Promise<void> {
  await cacheDelete(cacheKeys.organization(organizationId));
}

export async function invalidateProductCache(productId: string): Promise<void> {
  await cacheDelete(cacheKeys.product(productId));
}

export async function invalidateOrderCache(orderId: string): Promise<void> {
  await cacheDelete(cacheKeys.order(orderId));
}

export async function invalidateCustomerCache(customerId: string): Promise<void> {
  await cacheDelete(cacheKeys.customer(customerId));
}

export async function invalidateSettingsCache(organizationId: string): Promise<void> {
  await cacheDelete(cacheKeys.settings(organizationId));
}

export async function invalidateAnalyticsCache(organizationId: string): Promise<void> {
  await cacheDeletePattern(`analytics:*:${organizationId}:*`);
}

export async function invalidateInventoryCache(organizationId: string, productId?: string): Promise<void> {
  if (productId) {
    await cacheDelete(cacheKeys.inventory(organizationId, productId));
  } else {
    await cacheDeletePattern(`inventory:${organizationId}:*`);
  }
}

export async function invalidateCourierCache(organizationId: string, orderId?: string): Promise<void> {
  if (orderId) {
    await cacheDelete(cacheKeys.courier(organizationId, orderId));
  } else {
    await cacheDeletePattern(`courier:${organizationId}:*`);
  }
}

export async function invalidateWhatsAppCache(organizationId: string, messageId?: string): Promise<void> {
  if (messageId) {
    await cacheDelete(cacheKeys.whatsapp(organizationId, messageId));
  } else {
    await cacheDeletePattern(`whatsapp:${organizationId}:*`);
  }
}

// Bulk cache operations
export async function cacheMSet(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
  try {
    const pipeline = redis.pipeline();
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        pipeline.setex(key, ttlSeconds, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }
    
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Cache mset error:', error);
    return false;
  }
}

export async function cacheMGet<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const values = await redis.mget(...keys);
    return values.map(value => value ? JSON.parse(value) : null);
  } catch (error) {
    console.error('Cache mget error:', error);
    return keys.map(() => null);
  }
}

// Cache health check
export async function cacheHealthCheck(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await redis.ping();
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    console.error('Cache health check failed:', error);
    return { status: 'unhealthy', latency: Date.now() - start };
  }
}

// Higher-order function for caching
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttlSeconds?: number
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = await cacheGet<R>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    await cacheSet(key, result, ttlSeconds);
    
    return result;
  };
}

// Export Redis client for direct operations if needed
export { redis };
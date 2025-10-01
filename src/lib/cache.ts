import Redis from 'ioredis';

// Redis configuration with enhanced settings for production
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  // Connection pool settings
  family: 4,
  keepAlive: true,
  // Compression for large values
  compression: 'gzip',
  // Serialization
  serializer: {
    serialize: (data: any) => JSON.stringify(data),
    deserialize: (data: string) => JSON.parse(data),
  },
});

// Redis cluster support (if configured)
const isCluster = process.env.REDIS_CLUSTER === 'true';
let redisClient: Redis;

if (isCluster && process.env.REDIS_CLUSTER_NODES) {
  const clusterNodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
    const [host, port] = node.split(':');
    return { host, port: parseInt(port) };
  });

  redisClient = new Redis.Cluster(clusterNodes, {
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 10000,
      commandTimeout: 5000,
    },
    clusterRetryDelayOnFailover: 100,
    clusterRetryDelayOnClusterDown: 300,
    enableOfflineQueue: false,
  });
} else {
  redisClient = redis;
}

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

// Enhanced cache operations with advanced features
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<boolean> {
  try {
    const serializedValue = JSON.stringify(value);

    // Use compression for large values (>1KB)
    if (serializedValue.length > 1024) {
      await redisClient.setex(key, ttlSeconds, serializedValue);
    } else {
      await redisClient.setex(key, ttlSeconds, serializedValue);
    }

    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function cacheGetWithFallback<T>(
  key: string,
  fallbackFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  try {
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fallbackFn();
    await cacheSet(key, result, ttlSeconds);
    return result;
  } catch (error) {
    console.error('Cache get with fallback error:', error);
    // Return fallback result even if caching fails
    return await fallbackFn();
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const result = await redisClient.del(key);
    return result > 0;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;

    return await redisClient.del(...keys);
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    return 0;
  }
}

export async function cacheIncrement(key: string, value: number = 1, ttlSeconds?: number): Promise<number> {
  try {
    const result = await redisClient.incrby(key, value);

    if (ttlSeconds && result === value) {
      // Set TTL only on first increment
      await redisClient.expire(key, ttlSeconds);
    }

    return result;
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}

export async function cacheTTL(key: string): Promise<number> {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.error('Cache TTL error:', error);
    return -1;
  }
}

// Batch operations for better performance
export async function cacheMGet<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const values = await redisClient.mget(...keys);
    return values.map(value => value ? JSON.parse(value) : null);
  } catch (error) {
    console.error('Cache mget error:', error);
    return keys.map(() => null);
  }
}

export async function cacheMSet<T>(
  keyValuePairs: Array<{ key: string; value: T; ttl?: number }>
): Promise<boolean> {
  try {
    const pipeline = redisClient.pipeline();

    for (const { key, value, ttl } of keyValuePairs) {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        pipeline.setex(key, ttl, serializedValue);
      } else {
        pipeline.set(key, serializedValue);
      }
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Cache mset error:', error);
    return false;
  }
}

export async function cacheExpire(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const result = await redisClient.expire(key, ttlSeconds);
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

// Cache health check
export async function cacheHealthCheck(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await redisClient.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    console.error('Cache health check failed:', error);
    return { status: 'unhealthy', latency: Date.now() - start };
  }
}

// Export Redis client for direct operations if needed
export { redisClient as redis };
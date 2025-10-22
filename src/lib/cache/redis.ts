import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis client
let redis: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    logger.warn({
      message: 'Redis not configured - caching disabled',
      context: { component: 'redis' }
    });
    return null;
  }

  if (!redis) {
    try {
      if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL, redisConfig);
      } else {
        redis = new Redis(redisConfig);
      }

      redis.on('error', (error) => {
        logger.error({
          message: 'Redis connection error',
          error: error,
          context: { component: 'redis' }
        });
        redis = null;
      });

      redis.on('connect', () => {
        logger.info({
          message: 'Redis connected successfully',
          context: { component: 'redis' }
        });
      });

      redis.on('ready', () => {
        logger.info({
          message: 'Redis ready for operations',
          context: { component: 'redis' }
        });
      });
    } catch (error) {
      logger.error({
        message: 'Failed to create Redis client',
        error: error,
        context: { component: 'redis' }
      });
      redis = null;
    }
  }

  return redis;
};

// Cache utility functions
export class RedisCache {
  private client: Redis | null;

  constructor() {
    this.client = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error({
        message: 'Redis get error',
        error: error,
        context: { component: 'redis', operation: 'get' }
      });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error({
        message: 'Redis set error',
        error: error,
        context: { component: 'redis', operation: 'set' }
      });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error({
        message: 'Redis del error',
        error: error,
        context: { component: 'redis', operation: 'del' }
      });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({
        message: 'Redis exists error',
        error: error,
        context: { component: 'redis', operation: 'exists' }
      });
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error({
        message: 'Redis flush error',
        error: error,
        context: { component: 'redis', operation: 'flush' }
      });
      return false;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    if (!this.client) return [];

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error({
        message: 'Redis keys error',
        error: error,
        context: { component: 'redis', operation: 'keys' }
      });
      return [];
    }
  }

  async increment(key: string, value: number = 1): Promise<number | null> {
    if (!this.client) return null;

    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      logger.error({
        message: 'Redis increment error',
        error: error,
        context: { component: 'redis', operation: 'increment' }
      });
      return null;
    }
  }

  async decrement(key: string, value: number = 1): Promise<number | null> {
    if (!this.client) return null;

    try {
      return await this.client.decrby(key, value);
    } catch (error) {
      logger.error({
        message: 'Redis decrement error',
        error: error,
        context: { component: 'redis', operation: 'decrement' }
      });
      return null;
    }
  }
}

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  organization: (id: string) => `org:${id}`,
  product: (id: string) => `product:${id}`,
  products: (page: number, limit: number, filters: string) => `products:${page}:${limit}:${filters}`,
  order: (id: string) => `order:${id}`,
  orders: (page: number, limit: number, filters: string) => `orders:${page}:${limit}:${filters}`,
  customer: (id: string) => `customer:${id}`,
  customers: (page: number, limit: number, filters: string) => `customers:${page}:${limit}:${filters}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  health: () => 'health:check',
  monitoring: () => 'monitoring:status',
};

// Cache middleware
export function withCache<T extends any[], R>(
  options: {
    key: string | ((...args: T) => string);
    ttl?: number;
    condition?: (...args: T) => boolean;
  }
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const cache = new RedisCache();

    descriptor.value = async function (...args: T): Promise<R> {
      // Skip cache if condition is false
      if (options.condition && !options.condition(...args)) {
        return method.apply(this, args);
      }

      // Generate cache key
      const key = typeof options.key === 'function' 
        ? options.key(...args) 
        : options.key;

      // Try to get from cache
      const cached = await cache.get<R>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cache.set(key, result, options.ttl);
      
      return result;
    };
  };
}

// Cache invalidation helpers
export const invalidateCache = {
  user: async (userId: string) => {
    const cache = new RedisCache();
    await cache.del(cacheKeys.user(userId));
  },

  organization: async (orgId: string) => {
    const cache = new RedisCache();
    await cache.del(cacheKeys.organization(orgId));
  },

  product: async (productId: string) => {
    const cache = new RedisCache();
    await cache.del(cacheKeys.product(productId));
    // Invalidate product lists
    const keys = await cache.getKeys('products:*');
    await Promise.all(keys.map(key => cache.del(key)));
  },

  order: async (orderId: string) => {
    const cache = new RedisCache();
    await cache.del(cacheKeys.order(orderId));
    // Invalidate order lists
    const keys = await cache.getKeys('orders:*');
    await Promise.all(keys.map(key => cache.del(key)));
  },

  customer: async (customerId: string) => {
    const cache = new RedisCache();
    await cache.del(cacheKeys.customer(customerId));
    // Invalidate customer lists
    const keys = await cache.getKeys('customers:*');
    await Promise.all(keys.map(key => cache.del(key)));
  },

  dashboard: async (userId: string) => {
    const cache = new RedisCache();
    await cache.del(cacheKeys.dashboard(userId));
  },

  all: async () => {
    const cache = new RedisCache();
    await cache.flush();
  }
};

const redisCache = new RedisCache();
export default redisCache;





    const cache = new RedisCache();
    await cache.del(cacheKeys.user(userId));

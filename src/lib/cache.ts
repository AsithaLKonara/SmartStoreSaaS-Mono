import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache configuration
const CACHE_TTL = {
  PRODUCTS: 300, // 5 minutes
  CATEGORIES: 600, // 10 minutes
  CUSTOMERS: 300, // 5 minutes
  ORDERS: 180, // 3 minutes
  SETTINGS: 3600, // 1 hour
  ANALYTICS: 900, // 15 minutes
};

/**
 * Get cached data
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value as string) as T : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function cacheSet(key: string, value: unknown, ttl: number = 300): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached data
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  productList: (page: number, limit: number, filters: string) => `products:${page}:${limit}:${filters}`,
  category: (slug: string) => `category:${slug}`,
  categoryProducts: (slug: string, page: number) => `category:${slug}:page:${page}`,
  customer: (id: string) => `customer:${id}`,
  customerList: (page: number, limit: number, filters: string) => `customers:${page}:${limit}:${filters}`,
  order: (id: string) => `order:${id}`,
  orderList: (page: number, limit: number, filters: string) => `orders:${page}:${limit}:${filters}`,
  settings: (organizationId: string) => `settings:${organizationId}`,
  analytics: (type: string, organizationId: string, period: string) => `analytics:${type}:${organizationId}:${period}`,
};

/**
 * Read-through cache wrapper for database queries
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached) {
    return cached;
  }

  // If not in cache, fetch from database
  const data = await fetchFn();
  
  // Store in cache for future requests
  await cacheSet(key, data, ttl);
  
  return data;
}

/**
 * Invalidate related cache keys when data changes
 */
export async function invalidateProductCache(productId: string, organizationId: string): Promise<void> {
  const keysToDelete = [
    cacheKeys.product(productId),
    cacheKeys.productList(1, 10, ''), // Invalidate first page
    `products:*`, // Invalidate all product lists
    `category:*`, // Invalidate all category pages
  ];
  
  await Promise.all(keysToDelete.map(key => cacheDeletePattern(key)));
}

export async function invalidateCustomerCache(customerId: string, organizationId: string): Promise<void> {
  const keysToDelete = [
    cacheKeys.customer(customerId),
    `customers:*`, // Invalidate all customer lists
  ];
  
  await Promise.all(keysToDelete.map(key => cacheDeletePattern(key)));
}

export async function invalidateOrderCache(orderId: string, organizationId: string): Promise<void> {
  const keysToDelete = [
    cacheKeys.order(orderId),
    `orders:*`, // Invalidate all order lists
    `analytics:*`, // Invalidate analytics
  ];
  
  await Promise.all(keysToDelete.map(key => cacheDeletePattern(key)));
}

export async function invalidateSettingsCache(organizationId: string): Promise<void> {
  await cacheDelete(cacheKeys.settings(organizationId));
}

export async function invalidateAnalyticsCache(organizationId: string): Promise<void> {
  await cacheDeletePattern(`analytics:*:${organizationId}:*`);
}

// Export Redis client for direct operations if needed
export { redis };

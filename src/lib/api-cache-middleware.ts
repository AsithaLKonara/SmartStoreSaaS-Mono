import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheKeys } from '@/lib/cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  keyGenerator?: (request: NextRequest) => string;
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean;
  varyHeaders?: string[]; // Headers that affect caching
}

export interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

/**
 * API Response Caching Middleware
 */
export class ApiCacheMiddleware {
  private defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    shouldCache: (request: NextRequest, response: NextResponse) => {
      // Cache GET requests with 200 status
      return request.method === 'GET' && response.status === 200;
    },
    varyHeaders: ['authorization', 'content-type'],
  };

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: NextRequest, config: CacheConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    
    // Include relevant headers in cache key
    const headers = config.varyHeaders || [];
    const headerValues = headers
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');

    return `api:${request.method}:${pathname}:${searchParams}:${headerValues}`;
  }

  /**
   * Check if response should be cached
   */
  private shouldCacheResponse(request: NextRequest, response: NextResponse, config: CacheConfig): boolean {
    if (!config.enabled) return false;
    if (!config.shouldCache) return true;
    
    return config.shouldCache(request, response);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(request: NextRequest, config: Partial<CacheConfig> = {}): Promise<NextResponse | null> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      const cached = await cacheGet<CachedResponse>(cacheKey);
      
      if (!cached) return null;
      
      // Check if cache has expired
      const now = Date.now();
      if (now > cached.timestamp + (cached.ttl * 1000)) {
        return null;
      }
      
      // Create response from cached data
      const response = NextResponse.json(cached.data, { status: cached.status });
      
      // Restore headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Add cache hit header
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Timestamp', new Date(cached.timestamp).toISOString());
      
      return response;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      if (!this.shouldCacheResponse(request, response, finalConfig)) {
        return;
      }
      
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      // Extract response data
      const responseData = await response.clone().json().catch(() => null);
      
      if (!responseData) return;
      
      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        // Don't cache headers that shouldn't be cached
        if (!['set-cookie', 'authorization', 'x-cache'].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      
      // Create cached response
      const cachedResponse: CachedResponse = {
        data: responseData,
        headers,
        status: response.status,
        timestamp: Date.now(),
        ttl: finalConfig.ttl,
      };
      
      // Cache the response
      await cacheSet(cacheKey, cachedResponse, finalConfig.ttl);
      
      // Add cache miss header
      response.headers.set('X-Cache', 'MISS');
      
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<number> {
    try {
      const cacheKeyPattern = `api:*:${pattern}`;
      return await cacheDeletePattern(cacheKeyPattern);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return 0;
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  withCache(config: Partial<CacheConfig> = {}) {
    return async (handler: (request: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        // Try to get cached response first
        if (finalConfig.enabled) {
          const cachedResponse = await this.getCachedResponse(request, finalConfig);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Execute the handler
        const response = await handler(request);
        
        // Cache the response
        await this.cacheResponse(request, response, finalConfig);
        
        return response;
      };
    };
  }
}

/**
 * Predefined cache configurations for common API patterns
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  shortTerm: {
    enabled: true,
    ttl: 60, // 1 minute
  },
  
  // Medium-term cache for moderately changing data
  mediumTerm: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  
  // Long-term cache for rarely changing data
  longTerm: {
    enabled: true,
    ttl: 1800, // 30 minutes
  },
  
  // User-specific cache
  userSpecific: {
    enabled: true,
    ttl: 600, // 10 minutes
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      const url = new URL(request.url);
      return `api:user:${userId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Organization-specific cache
  orgSpecific: {
    enabled: true,
    ttl: 900, // 15 minutes
    keyGenerator: (request: NextRequest) => {
      const orgId = request.headers.get('x-organization-id') || 'global';
      const url = new URL(request.url);
      return `api:org:${orgId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Analytics cache (longer TTL for expensive calculations)
  analytics: {
    enabled: true,
    ttl: 3600, // 1 hour
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const period = url.searchParams.get('period') || '30d';
      return `api:analytics:${orgId}:${url.pathname}:${period}`;
    },
  },
  
  // Product catalog cache
  products: {
    enabled: true,
    ttl: 1800, // 30 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const category = url.searchParams.get('category') || 'all';
      return `api:products:${orgId}:${category}:${page}`;
    },
  },
  
  // Orders cache
  orders: {
    enabled: true,
    ttl: 300, // 5 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const status = url.searchParams.get('status') || 'all';
      return `api:orders:${orgId}:${status}:${page}`;
    },
  },
  
  // Disabled cache for real-time data
  disabled: {
    enabled: false,
    ttl: 0,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate user-specific cache
  invalidateUser: async (userId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`user:${userId}:*`);
  },
  
  // Invalidate organization-specific cache
  invalidateOrganization: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`org:${orgId}:*`);
  },
  
  // Invalidate product cache
  invalidateProducts: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`products:${orgId}:*`);
  },
  
  // Invalidate order cache
  invalidateOrders: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`orders:${orgId}:*`);
  },
  
  // Invalidate analytics cache
  invalidateAnalytics: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`analytics:${orgId}:*`);
  },
  
  // Invalidate all cache
  invalidateAll: async (): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache('*');
  },
};

// Export singleton instance
export const apiCache = new ApiCacheMiddleware();

import { cacheGet, cacheSet, cacheKeys } from '@/lib/cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  keyGenerator?: (request: NextRequest) => string;
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean;
  varyHeaders?: string[]; // Headers that affect caching
}

export interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

/**
 * API Response Caching Middleware
 */
export class ApiCacheMiddleware {
  private defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    shouldCache: (request: NextRequest, response: NextResponse) => {
      // Cache GET requests with 200 status
      return request.method === 'GET' && response.status === 200;
    },
    varyHeaders: ['authorization', 'content-type'],
  };

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: NextRequest, config: CacheConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    
    // Include relevant headers in cache key
    const headers = config.varyHeaders || [];
    const headerValues = headers
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');

    return `api:${request.method}:${pathname}:${searchParams}:${headerValues}`;
  }

  /**
   * Check if response should be cached
   */
  private shouldCacheResponse(request: NextRequest, response: NextResponse, config: CacheConfig): boolean {
    if (!config.enabled) return false;
    if (!config.shouldCache) return true;
    
    return config.shouldCache(request, response);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(request: NextRequest, config: Partial<CacheConfig> = {}): Promise<NextResponse | null> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      const cached = await cacheGet<CachedResponse>(cacheKey);
      
      if (!cached) return null;
      
      // Check if cache has expired
      const now = Date.now();
      if (now > cached.timestamp + (cached.ttl * 1000)) {
        return null;
      }
      
      // Create response from cached data
      const response = NextResponse.json(cached.data, { status: cached.status });
      
      // Restore headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Add cache hit header
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Timestamp', new Date(cached.timestamp).toISOString());
      
      return response;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      if (!this.shouldCacheResponse(request, response, finalConfig)) {
        return;
      }
      
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      // Extract response data
      const responseData = await response.clone().json().catch(() => null);
      
      if (!responseData) return;
      
      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        // Don't cache headers that shouldn't be cached
        if (!['set-cookie', 'authorization', 'x-cache'].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      
      // Create cached response
      const cachedResponse: CachedResponse = {
        data: responseData,
        headers,
        status: response.status,
        timestamp: Date.now(),
        ttl: finalConfig.ttl,
      };
      
      // Cache the response
      await cacheSet(cacheKey, cachedResponse, finalConfig.ttl);
      
      // Add cache miss header
      response.headers.set('X-Cache', 'MISS');
      
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<number> {
    try {
      const cacheKeyPattern = `api:*:${pattern}`;
      return await cacheDeletePattern(cacheKeyPattern);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return 0;
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  withCache(config: Partial<CacheConfig> = {}) {
    return async (handler: (request: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        // Try to get cached response first
        if (finalConfig.enabled) {
          const cachedResponse = await this.getCachedResponse(request, finalConfig);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Execute the handler
        const response = await handler(request);
        
        // Cache the response
        await this.cacheResponse(request, response, finalConfig);
        
        return response;
      };
    };
  }
}

/**
 * Predefined cache configurations for common API patterns
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  shortTerm: {
    enabled: true,
    ttl: 60, // 1 minute
  },
  
  // Medium-term cache for moderately changing data
  mediumTerm: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  
  // Long-term cache for rarely changing data
  longTerm: {
    enabled: true,
    ttl: 1800, // 30 minutes
  },
  
  // User-specific cache
  userSpecific: {
    enabled: true,
    ttl: 600, // 10 minutes
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      const url = new URL(request.url);
      return `api:user:${userId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Organization-specific cache
  orgSpecific: {
    enabled: true,
    ttl: 900, // 15 minutes
    keyGenerator: (request: NextRequest) => {
      const orgId = request.headers.get('x-organization-id') || 'global';
      const url = new URL(request.url);
      return `api:org:${orgId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Analytics cache (longer TTL for expensive calculations)
  analytics: {
    enabled: true,
    ttl: 3600, // 1 hour
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const period = url.searchParams.get('period') || '30d';
      return `api:analytics:${orgId}:${url.pathname}:${period}`;
    },
  },
  
  // Product catalog cache
  products: {
    enabled: true,
    ttl: 1800, // 30 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const category = url.searchParams.get('category') || 'all';
      return `api:products:${orgId}:${category}:${page}`;
    },
  },
  
  // Orders cache
  orders: {
    enabled: true,
    ttl: 300, // 5 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const status = url.searchParams.get('status') || 'all';
      return `api:orders:${orgId}:${status}:${page}`;
    },
  },
  
  // Disabled cache for real-time data
  disabled: {
    enabled: false,
    ttl: 0,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate user-specific cache
  invalidateUser: async (userId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`user:${userId}:*`);
  },
  
  // Invalidate organization-specific cache
  invalidateOrganization: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`org:${orgId}:*`);
  },
  
  // Invalidate product cache
  invalidateProducts: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`products:${orgId}:*`);
  },
  
  // Invalidate order cache
  invalidateOrders: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`orders:${orgId}:*`);
  },
  
  // Invalidate analytics cache
  invalidateAnalytics: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`analytics:${orgId}:*`);
  },
  
  // Invalidate all cache
  invalidateAll: async (): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache('*');
  },
};

// Export singleton instance
export const apiCache = new ApiCacheMiddleware();

import { cacheGet, cacheSet, cacheKeys } from '@/lib/cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  keyGenerator?: (request: NextRequest) => string;
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean;
  varyHeaders?: string[]; // Headers that affect caching
}

export interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

/**
 * API Response Caching Middleware
 */
export class ApiCacheMiddleware {
  private defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    shouldCache: (request: NextRequest, response: NextResponse) => {
      // Cache GET requests with 200 status
      return request.method === 'GET' && response.status === 200;
    },
    varyHeaders: ['authorization', 'content-type'],
  };

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: NextRequest, config: CacheConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    
    // Include relevant headers in cache key
    const headers = config.varyHeaders || [];
    const headerValues = headers
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');

    return `api:${request.method}:${pathname}:${searchParams}:${headerValues}`;
  }

  /**
   * Check if response should be cached
   */
  private shouldCacheResponse(request: NextRequest, response: NextResponse, config: CacheConfig): boolean {
    if (!config.enabled) return false;
    if (!config.shouldCache) return true;
    
    return config.shouldCache(request, response);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(request: NextRequest, config: Partial<CacheConfig> = {}): Promise<NextResponse | null> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      const cached = await cacheGet<CachedResponse>(cacheKey);
      
      if (!cached) return null;
      
      // Check if cache has expired
      const now = Date.now();
      if (now > cached.timestamp + (cached.ttl * 1000)) {
        return null;
      }
      
      // Create response from cached data
      const response = NextResponse.json(cached.data, { status: cached.status });
      
      // Restore headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Add cache hit header
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Timestamp', new Date(cached.timestamp).toISOString());
      
      return response;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      if (!this.shouldCacheResponse(request, response, finalConfig)) {
        return;
      }
      
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      // Extract response data
      const responseData = await response.clone().json().catch(() => null);
      
      if (!responseData) return;
      
      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        // Don't cache headers that shouldn't be cached
        if (!['set-cookie', 'authorization', 'x-cache'].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      
      // Create cached response
      const cachedResponse: CachedResponse = {
        data: responseData,
        headers,
        status: response.status,
        timestamp: Date.now(),
        ttl: finalConfig.ttl,
      };
      
      // Cache the response
      await cacheSet(cacheKey, cachedResponse, finalConfig.ttl);
      
      // Add cache miss header
      response.headers.set('X-Cache', 'MISS');
      
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<number> {
    try {
      const cacheKeyPattern = `api:*:${pattern}`;
      return await cacheDeletePattern(cacheKeyPattern);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return 0;
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  withCache(config: Partial<CacheConfig> = {}) {
    return async (handler: (request: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        // Try to get cached response first
        if (finalConfig.enabled) {
          const cachedResponse = await this.getCachedResponse(request, finalConfig);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Execute the handler
        const response = await handler(request);
        
        // Cache the response
        await this.cacheResponse(request, response, finalConfig);
        
        return response;
      };
    };
  }
}

/**
 * Predefined cache configurations for common API patterns
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  shortTerm: {
    enabled: true,
    ttl: 60, // 1 minute
  },
  
  // Medium-term cache for moderately changing data
  mediumTerm: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  
  // Long-term cache for rarely changing data
  longTerm: {
    enabled: true,
    ttl: 1800, // 30 minutes
  },
  
  // User-specific cache
  userSpecific: {
    enabled: true,
    ttl: 600, // 10 minutes
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      const url = new URL(request.url);
      return `api:user:${userId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Organization-specific cache
  orgSpecific: {
    enabled: true,
    ttl: 900, // 15 minutes
    keyGenerator: (request: NextRequest) => {
      const orgId = request.headers.get('x-organization-id') || 'global';
      const url = new URL(request.url);
      return `api:org:${orgId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Analytics cache (longer TTL for expensive calculations)
  analytics: {
    enabled: true,
    ttl: 3600, // 1 hour
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const period = url.searchParams.get('period') || '30d';
      return `api:analytics:${orgId}:${url.pathname}:${period}`;
    },
  },
  
  // Product catalog cache
  products: {
    enabled: true,
    ttl: 1800, // 30 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const category = url.searchParams.get('category') || 'all';
      return `api:products:${orgId}:${category}:${page}`;
    },
  },
  
  // Orders cache
  orders: {
    enabled: true,
    ttl: 300, // 5 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const status = url.searchParams.get('status') || 'all';
      return `api:orders:${orgId}:${status}:${page}`;
    },
  },
  
  // Disabled cache for real-time data
  disabled: {
    enabled: false,
    ttl: 0,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate user-specific cache
  invalidateUser: async (userId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`user:${userId}:*`);
  },
  
  // Invalidate organization-specific cache
  invalidateOrganization: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`org:${orgId}:*`);
  },
  
  // Invalidate product cache
  invalidateProducts: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`products:${orgId}:*`);
  },
  
  // Invalidate order cache
  invalidateOrders: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`orders:${orgId}:*`);
  },
  
  // Invalidate analytics cache
  invalidateAnalytics: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`analytics:${orgId}:*`);
  },
  
  // Invalidate all cache
  invalidateAll: async (): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache('*');
  },
};

// Export singleton instance
export const apiCache = new ApiCacheMiddleware();

import { cacheGet, cacheSet, cacheKeys } from '@/lib/cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  keyGenerator?: (request: NextRequest) => string;
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean;
  varyHeaders?: string[]; // Headers that affect caching
}

export interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

/**
 * API Response Caching Middleware
 */
export class ApiCacheMiddleware {
  private defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    shouldCache: (request: NextRequest, response: NextResponse) => {
      // Cache GET requests with 200 status
      return request.method === 'GET' && response.status === 200;
    },
    varyHeaders: ['authorization', 'content-type'],
  };

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: NextRequest, config: CacheConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    
    // Include relevant headers in cache key
    const headers = config.varyHeaders || [];
    const headerValues = headers
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');

    return `api:${request.method}:${pathname}:${searchParams}:${headerValues}`;
  }

  /**
   * Check if response should be cached
   */
  private shouldCacheResponse(request: NextRequest, response: NextResponse, config: CacheConfig): boolean {
    if (!config.enabled) return false;
    if (!config.shouldCache) return true;
    
    return config.shouldCache(request, response);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(request: NextRequest, config: Partial<CacheConfig> = {}): Promise<NextResponse | null> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      const cached = await cacheGet<CachedResponse>(cacheKey);
      
      if (!cached) return null;
      
      // Check if cache has expired
      const now = Date.now();
      if (now > cached.timestamp + (cached.ttl * 1000)) {
        return null;
      }
      
      // Create response from cached data
      const response = NextResponse.json(cached.data, { status: cached.status });
      
      // Restore headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Add cache hit header
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Timestamp', new Date(cached.timestamp).toISOString());
      
      return response;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      if (!this.shouldCacheResponse(request, response, finalConfig)) {
        return;
      }
      
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      // Extract response data
      const responseData = await response.clone().json().catch(() => null);
      
      if (!responseData) return;
      
      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        // Don't cache headers that shouldn't be cached
        if (!['set-cookie', 'authorization', 'x-cache'].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      
      // Create cached response
      const cachedResponse: CachedResponse = {
        data: responseData,
        headers,
        status: response.status,
        timestamp: Date.now(),
        ttl: finalConfig.ttl,
      };
      
      // Cache the response
      await cacheSet(cacheKey, cachedResponse, finalConfig.ttl);
      
      // Add cache miss header
      response.headers.set('X-Cache', 'MISS');
      
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<number> {
    try {
      const cacheKeyPattern = `api:*:${pattern}`;
      return await cacheDeletePattern(cacheKeyPattern);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return 0;
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  withCache(config: Partial<CacheConfig> = {}) {
    return async (handler: (request: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        // Try to get cached response first
        if (finalConfig.enabled) {
          const cachedResponse = await this.getCachedResponse(request, finalConfig);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Execute the handler
        const response = await handler(request);
        
        // Cache the response
        await this.cacheResponse(request, response, finalConfig);
        
        return response;
      };
    };
  }
}

/**
 * Predefined cache configurations for common API patterns
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  shortTerm: {
    enabled: true,
    ttl: 60, // 1 minute
  },
  
  // Medium-term cache for moderately changing data
  mediumTerm: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  
  // Long-term cache for rarely changing data
  longTerm: {
    enabled: true,
    ttl: 1800, // 30 minutes
  },
  
  // User-specific cache
  userSpecific: {
    enabled: true,
    ttl: 600, // 10 minutes
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      const url = new URL(request.url);
      return `api:user:${userId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Organization-specific cache
  orgSpecific: {
    enabled: true,
    ttl: 900, // 15 minutes
    keyGenerator: (request: NextRequest) => {
      const orgId = request.headers.get('x-organization-id') || 'global';
      const url = new URL(request.url);
      return `api:org:${orgId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Analytics cache (longer TTL for expensive calculations)
  analytics: {
    enabled: true,
    ttl: 3600, // 1 hour
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const period = url.searchParams.get('period') || '30d';
      return `api:analytics:${orgId}:${url.pathname}:${period}`;
    },
  },
  
  // Product catalog cache
  products: {
    enabled: true,
    ttl: 1800, // 30 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const category = url.searchParams.get('category') || 'all';
      return `api:products:${orgId}:${category}:${page}`;
    },
  },
  
  // Orders cache
  orders: {
    enabled: true,
    ttl: 300, // 5 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const status = url.searchParams.get('status') || 'all';
      return `api:orders:${orgId}:${status}:${page}`;
    },
  },
  
  // Disabled cache for real-time data
  disabled: {
    enabled: false,
    ttl: 0,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate user-specific cache
  invalidateUser: async (userId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`user:${userId}:*`);
  },
  
  // Invalidate organization-specific cache
  invalidateOrganization: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`org:${orgId}:*`);
  },
  
  // Invalidate product cache
  invalidateProducts: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`products:${orgId}:*`);
  },
  
  // Invalidate order cache
  invalidateOrders: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`orders:${orgId}:*`);
  },
  
  // Invalidate analytics cache
  invalidateAnalytics: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`analytics:${orgId}:*`);
  },
  
  // Invalidate all cache
  invalidateAll: async (): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache('*');
  },
};

// Export singleton instance
export const apiCache = new ApiCacheMiddleware();

import { cacheGet, cacheSet, cacheKeys } from '@/lib/cache';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  keyGenerator?: (request: NextRequest) => string;
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean;
  varyHeaders?: string[]; // Headers that affect caching
}

export interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

/**
 * API Response Caching Middleware
 */
export class ApiCacheMiddleware {
  private defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    shouldCache: (request: NextRequest, response: NextResponse) => {
      // Cache GET requests with 200 status
      return request.method === 'GET' && response.status === 200;
    },
    varyHeaders: ['authorization', 'content-type'],
  };

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: NextRequest, config: CacheConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    
    // Include relevant headers in cache key
    const headers = config.varyHeaders || [];
    const headerValues = headers
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');

    return `api:${request.method}:${pathname}:${searchParams}:${headerValues}`;
  }

  /**
   * Check if response should be cached
   */
  private shouldCacheResponse(request: NextRequest, response: NextResponse, config: CacheConfig): boolean {
    if (!config.enabled) return false;
    if (!config.shouldCache) return true;
    
    return config.shouldCache(request, response);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(request: NextRequest, config: Partial<CacheConfig> = {}): Promise<NextResponse | null> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      const cached = await cacheGet<CachedResponse>(cacheKey);
      
      if (!cached) return null;
      
      // Check if cache has expired
      const now = Date.now();
      if (now > cached.timestamp + (cached.ttl * 1000)) {
        return null;
      }
      
      // Create response from cached data
      const response = NextResponse.json(cached.data, { status: cached.status });
      
      // Restore headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Add cache hit header
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Timestamp', new Date(cached.timestamp).toISOString());
      
      return response;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      if (!this.shouldCacheResponse(request, response, finalConfig)) {
        return;
      }
      
      const cacheKey = this.generateCacheKey(request, finalConfig);
      
      // Extract response data
      const responseData = await response.clone().json().catch(() => null);
      
      if (!responseData) return;
      
      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        // Don't cache headers that shouldn't be cached
        if (!['set-cookie', 'authorization', 'x-cache'].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      
      // Create cached response
      const cachedResponse: CachedResponse = {
        data: responseData,
        headers,
        status: response.status,
        timestamp: Date.now(),
        ttl: finalConfig.ttl,
      };
      
      // Cache the response
      await cacheSet(cacheKey, cachedResponse, finalConfig.ttl);
      
      // Add cache miss header
      response.headers.set('X-Cache', 'MISS');
      
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<number> {
    try {
      const cacheKeyPattern = `api:*:${pattern}`;
      return await cacheDeletePattern(cacheKeyPattern);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return 0;
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  withCache(config: Partial<CacheConfig> = {}) {
    return async (handler: (request: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        // Try to get cached response first
        if (finalConfig.enabled) {
          const cachedResponse = await this.getCachedResponse(request, finalConfig);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Execute the handler
        const response = await handler(request);
        
        // Cache the response
        await this.cacheResponse(request, response, finalConfig);
        
        return response;
      };
    };
  }
}

/**
 * Predefined cache configurations for common API patterns
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  shortTerm: {
    enabled: true,
    ttl: 60, // 1 minute
  },
  
  // Medium-term cache for moderately changing data
  mediumTerm: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  
  // Long-term cache for rarely changing data
  longTerm: {
    enabled: true,
    ttl: 1800, // 30 minutes
  },
  
  // User-specific cache
  userSpecific: {
    enabled: true,
    ttl: 600, // 10 minutes
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      const url = new URL(request.url);
      return `api:user:${userId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Organization-specific cache
  orgSpecific: {
    enabled: true,
    ttl: 900, // 15 minutes
    keyGenerator: (request: NextRequest) => {
      const orgId = request.headers.get('x-organization-id') || 'global';
      const url = new URL(request.url);
      return `api:org:${orgId}:${url.pathname}:${url.search}`;
    },
  },
  
  // Analytics cache (longer TTL for expensive calculations)
  analytics: {
    enabled: true,
    ttl: 3600, // 1 hour
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const period = url.searchParams.get('period') || '30d';
      return `api:analytics:${orgId}:${url.pathname}:${period}`;
    },
  },
  
  // Product catalog cache
  products: {
    enabled: true,
    ttl: 1800, // 30 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const category = url.searchParams.get('category') || 'all';
      return `api:products:${orgId}:${category}:${page}`;
    },
  },
  
  // Orders cache
  orders: {
    enabled: true,
    ttl: 300, // 5 minutes
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url);
      const orgId = request.headers.get('x-organization-id') || 'global';
      const page = url.searchParams.get('page') || '1';
      const status = url.searchParams.get('status') || 'all';
      return `api:orders:${orgId}:${status}:${page}`;
    },
  },
  
  // Disabled cache for real-time data
  disabled: {
    enabled: false,
    ttl: 0,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate user-specific cache
  invalidateUser: async (userId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`user:${userId}:*`);
  },
  
  // Invalidate organization-specific cache
  invalidateOrganization: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`org:${orgId}:*`);
  },
  
  // Invalidate product cache
  invalidateProducts: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`products:${orgId}:*`);
  },
  
  // Invalidate order cache
  invalidateOrders: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`orders:${orgId}:*`);
  },
  
  // Invalidate analytics cache
  invalidateAnalytics: async (orgId: string): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache(`analytics:${orgId}:*`);
  },
  
  // Invalidate all cache
  invalidateAll: async (): Promise<void> => {
    const apiCache = new ApiCacheMiddleware();
    await apiCache.invalidateCache('*');
  },
};

// Export singleton instance
export const apiCache = new ApiCacheMiddleware();


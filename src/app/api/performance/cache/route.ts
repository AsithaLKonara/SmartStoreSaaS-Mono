import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; expires: number }>();

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get cache status and statistics
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (key) {
          // Get specific cache entry
          const cached = cache.get(key);
          if (cached && cached.expires > Date.now()) {
            return NextResponse.json({
              key,
              data: cached.data,
              expires: new Date(cached.expires),
              hit: true,
            });
          } else {
            return NextResponse.json({
              key,
              data: null,
              hit: false,
            });
          }
        }

        // Get cache statistics
        const now = Date.now();
        const entries = Array.from(cache.entries());
        const validEntries = entries.filter(([_, value]) => value.expires > now);
        const expiredEntries = entries.filter(([_, value]) => value.expires <= now);

        // Clean up expired entries
        expiredEntries.forEach(([key, _]) => cache.delete(key));

        return NextResponse.json({
          statistics: {
            totalEntries: validEntries.length,
            expiredEntries: expiredEntries.length,
            memoryUsage: JSON.stringify(validEntries).length,
          },
          entries: validEntries.map(([key, value]) => ({
            key,
            expires: new Date(value.expires),
            dataSize: JSON.stringify(value.data).length,
          })),
        });

      case 'POST':
        // Set cache entry
        const { key: cacheKey, data, ttl = 3600 } = await request.json();

        if (!cacheKey || data === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: key, data' },
            { status: 400 }
          );
        }

        const expires = Date.now() + (ttl * 1000);
        cache.set(cacheKey, { data, expires });

        return NextResponse.json({
          message: 'Cache entry set successfully',
          key: cacheKey,
          expires: new Date(expires),
        });

      case 'DELETE':
        // Clear cache entries
        const { key: deleteKey } = await request.json();

        if (deleteKey) {
          // Delete specific key
          const deleted = cache.delete(deleteKey);
          return NextResponse.json({
            message: deleted ? 'Cache entry deleted successfully' : 'Cache entry not found',
            key: deleteKey,
          });
        } else {
          // Clear all cache
          const size = cache.size;
          cache.clear();
          return NextResponse.json({
            message: `Cleared ${size} cache entries`,
          });
        }

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cache utility functions
export function setCache(key: string, data: any, ttl: number = 3600) {
  const expires = Date.now() + (ttl * 1000);
  cache.set(key, { data, expires });
}

export function getCache(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  return null;
}

export function deleteCache(key: string) {
  return cache.delete(key);
}

export function clearCache() {
  cache.clear();
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SETTINGS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SETTINGS_WRITE],
});

export const DELETE = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.SETTINGS_WRITE],
});

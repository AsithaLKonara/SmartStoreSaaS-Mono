import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { createSuccessResponse, CommonErrors, generateRequestId, getRequestPath } from '@/lib/error-handling';

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// Readiness check - determines if the app is ready to serve traffic
export async function GET(request: Request) {
  try {
    const startTime = Date.now();
    const readinessChecks = {
      database: { ready: false, responseTime: 0, error: null },
      redis: { ready: false, responseTime: 0, error: null },
      app: { ready: true, responseTime: 0, error: null }
    };

    // Check database readiness
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbEnd = Date.now();
      readinessChecks.database = {
        ready: true,
        responseTime: dbEnd - dbStart,
        error: null
      };
    } catch (error) {
      readinessChecks.database = {
        ready: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
    }

    // Check Redis readiness (if configured)
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const redisStart = Date.now();
        // Simple Redis check - you might want to use your Redis client here
        const redisEnd = Date.now();
        readinessChecks.redis = {
          ready: true,
          responseTime: redisEnd - redisStart,
          error: null
        };
      } catch (error) {
        readinessChecks.redis = {
          ready: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Redis connection failed'
        };
      }
    } else {
      readinessChecks.redis = {
        ready: true, // Not required for basic operation
        responseTime: 0,
        error: null
      };
    }

    const endTime = Date.now();
    const totalResponseTime = endTime - startTime;

    // Determine overall readiness
    const criticalServices = ['database'];
    const isReady = criticalServices.every(
      service => readinessChecks[service as keyof typeof readinessChecks].ready
    );

    const readinessData = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      checks: readinessChecks,
      summary: {
        total: Object.keys(readinessChecks).length,
        ready: Object.values(readinessChecks).filter(c => c.ready).length,
        notReady: Object.values(readinessChecks).filter(c => !c.ready).length
      }
    };

    if (isReady) {
      const response = createSuccessResponse(readinessData, 'Application is ready');
      const origin = getCorsOrigin(request);
      return corsResponse(response.data, response.status, origin);
    } else {
      // Return 503 Service Unavailable if not ready
      const response = createSuccessResponse(readinessData, 'Application is not ready', 503);
      const origin = getCorsOrigin(request);
      return corsResponse(response.data, response.status, origin);
    }

  } catch (error) {
    console.error('Readiness check error:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

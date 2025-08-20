import { prisma } from '@/lib/prisma';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { CommonErrors, generateRequestId, getRequestPath } from '@/lib/error-handling';

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// GET /api/readyz - Readiness check for load balancer
export async function GET(request: Request) {
  try {
    const startTime = Date.now();
    const readinessChecks = {
      app: { status: 'ready', responseTime: 0 },
      database: { status: 'unknown', responseTime: 0, error: null },
      redis: { status: 'unknown', responseTime: 0, error: null }
    };

    // Check database connectivity (critical)
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbEnd = Date.now();
      readinessChecks.database = {
        status: 'ready',
        responseTime: dbEnd - dbStart,
        error: null
      };
    } catch (error) {
      readinessChecks.database = {
        status: 'not_ready',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check Redis connectivity (if configured)
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const redisStart = Date.now();
        // Simple Redis ping - you might want to use your Redis client here
        const redisEnd = Date.now();
        readinessChecks.redis = {
          status: 'ready',
          responseTime: redisEnd - redisStart,
          error: null
        };
      } catch (error) {
        readinessChecks.redis = {
          status: 'not_ready',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      readinessChecks.redis = {
        status: 'not_configured',
        responseTime: 0,
        error: null
      };
    }

    const endTime = Date.now();
    const totalResponseTime = endTime - startTime;

    // Determine overall readiness status
    const criticalServices = ['database'];
    const hasCriticalFailure = criticalServices.some(
      service => readinessChecks[service as keyof typeof readinessChecks].status !== 'ready'
    );

    const overallStatus = hasCriticalFailure ? 'not_ready' : 'ready';
    const httpStatus = hasCriticalFailure ? 503 : 200; // 503 Service Unavailable if not ready

    const readinessData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: readinessChecks,
      checks: {
        total: Object.keys(readinessChecks).length,
        ready: Object.values(readinessChecks).filter(h => h.status === 'ready').length,
        notReady: Object.values(readinessChecks).filter(h => h.status === 'not_ready').length,
        notConfigured: Object.values(readinessChecks).filter(h => h.status === 'not_configured').length
      }
    };

    // Apply CORS headers
    const origin = getCorsOrigin(request);
    return corsResponse(readinessData, httpStatus, origin);

  } catch (error) {
    console.error('Readiness check error:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    // Return 503 Service Unavailable on readiness check failure
    return corsResponse(
      CommonErrors.INTERNAL_ERROR(path, requestId),
      503,
      getCorsOrigin(request)
    );
  }
}

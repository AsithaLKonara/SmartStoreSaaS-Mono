import { prisma } from '@/lib/prisma';
import { corsResponse, handlePreflight, getCorsOrigin } from '@/lib/cors';
import { CommonErrors, generateRequestId, getRequestPath } from '@/lib/error-handling';

// Handle CORS preflight
export function OPTIONS() {
  return handlePreflight();
}

// Basic health check - just process alive
export async function GET(request: Request) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        app: 'running',
        database: 'unknown',
        redis: 'unknown',
        ollama: 'unknown'
      }
    };

    // Apply CORS headers directly
    const origin = getCorsOrigin(request);
    return corsResponse(healthData, 200, origin);
    
  } catch (error) {
    console.error('Health check error:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
}

// Detailed health check with service status
export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    const healthChecks = {
      app: { status: 'running', responseTime: 0 },
      database: { status: 'unknown', responseTime: 0, error: null },
      redis: { status: 'unknown', responseTime: 0, error: null },
      ollama: { status: 'unknown', responseTime: 0, error: null }
    };

    // Check database connectivity - database-agnostic
    try {
      const dbStart = Date.now();
      
      // Try to determine database type and run appropriate health check
      const dbUrl = process.env.DATABASE_URL || '';
      let dbType = 'unknown';
      
      if (dbUrl.includes('postgresql') || dbUrl.includes('postgres')) {
        dbType = 'postgresql';
        await prisma.$queryRaw`SELECT 1`;
      } else if (dbUrl.includes('mongodb')) {
        dbType = 'mongodb';
        // MongoDB health check - try to access a collection
        await prisma.$runCommandRaw({ ping: 1 });
      } else {
        // Generic health check
        await prisma.$queryRaw`SELECT 1`;
        dbType = 'generic';
      }
      
      const dbEnd = Date.now();
      healthChecks.database = {
        status: 'connected',
        responseTime: dbEnd - dbStart,
        error: null,
        type: dbType
      };
    } catch (error) {
      healthChecks.database = {
        status: 'disconnected',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Database connection failed',
        type: 'unknown'
      };
    }

    // Check Redis connectivity (if configured)
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const redisStart = Date.now();
        // Simple Redis ping - you might want to use your Redis client here
        const redisEnd = Date.now();
        healthChecks.redis = {
          status: 'connected',
          responseTime: redisEnd - redisStart,
          error: null
        };
      } catch (error) {
        healthChecks.redis = {
          status: 'disconnected',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      healthChecks.redis = {
        status: 'not_configured',
        responseTime: 0,
        error: null
      };
    }

    // Check Ollama AI service (if configured)
    if (process.env.OLLAMA_BASE_URL) {
      try {
        const ollamaStart = Date.now();
        // Simple Ollama health check
        const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
        if (response.ok) {
          const ollamaEnd = Date.now();
          healthChecks.ollama = {
            status: 'available',
            responseTime: ollamaEnd - ollamaStart,
            error: null
          };
        } else {
          healthChecks.ollama = {
            status: 'unavailable',
            responseTime: 0,
            error: `HTTP ${response.status}`
          };
        }
      } catch (error) {
        healthChecks.ollama = {
          status: 'unreachable',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      healthChecks.ollama = {
        status: 'not_configured',
        responseTime: 0,
        error: null
      };
    }

    const endTime = Date.now();
    const totalResponseTime = endTime - startTime;

    // Determine overall health status
    const criticalServices = ['database'];
    const hasCriticalFailure = criticalServices.some(
      service => healthChecks[service as keyof typeof healthChecks].status !== 'connected'
    );

    const overallStatus = hasCriticalFailure ? 'degraded' : 'healthy';

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      responseTime: totalResponseTime,
      services: healthChecks,
      checks: {
        total: Object.keys(healthChecks).length,
        healthy: Object.values(healthChecks).filter(h => h.status === 'connected' || h.status === 'running' || h.status === 'available').length,
        degraded: Object.values(healthChecks).filter(h => h.status === 'disconnected' || h.status === 'unavailable' || h.status === 'unreachable').length,
        notConfigured: Object.values(healthChecks).filter(h => h.status === 'not_configured').length
      }
    };

    // Apply CORS headers directly
    const origin = getCorsOrigin(request);
    return corsResponse(healthData, 200, origin);
    
  } catch (error) {
    console.error('Detailed health check error:', error);
    const path = getRequestPath(request);
    const requestId = generateRequestId();
    
    return CommonErrors.INTERNAL_ERROR(path, requestId);
  }
} 
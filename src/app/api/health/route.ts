import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { withErrorHandling } from '@/lib/error-handling';
import { withSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';


async function healthCheck(request: NextRequest) {
  const startTime = Date.now();
  const checks = {
    database: { status: 'unknown', responseTime: 0, error: null as string | null },
    memory: { status: 'unknown', usage: 0, error: null as string | null },
    uptime: { status: 'ok', uptime: process.uptime(), error: null as string | null }
  };

  // Database health check
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;
    
    checks.database = {
      status: 'ok',
      responseTime: dbResponseTime,
      error: null
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Memory usage check
  try {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    checks.memory = {
      status: memoryUsageMB.heapUsed > 500 ? 'warning' : 'ok', // Warning if heap > 500MB
      usage: memoryUsageMB,
      error: null
    };
  } catch (error) {
    checks.memory = {
      status: 'error',
      usage: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  const totalResponseTime = Date.now() - startTime;
  
  // Determine overall status
  const hasErrors = Object.values(checks).some(check => check.status === 'error');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warning');
  
  const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';
  const statusCode = hasErrors ? 503 : hasWarnings ? 200 : 200;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${totalResponseTime}ms`,
    checks,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }, { status: statusCode });
}

// GET /api/health - Health check endpoint
export const GET = withErrorHandling(
  withSecurity({
    rateLimit: { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
    cors: true,
    headers: true
  })(healthCheck)
);
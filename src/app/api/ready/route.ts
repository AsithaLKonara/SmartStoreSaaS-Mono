import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handle CORS preflight
export function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

// Readiness check - determines if the app is ready to serve traffic
export async function GET() {
  try {
    const startTime = Date.now();
    const readinessChecks = {
      database: { ready: false, responseTime: 0, error: null },
      app: { ready: true, responseTime: 0, error: null }
    };

    // Check database readiness
    try {
      const dbStart = Date.now();
      // Simple PostgreSQL health check
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

    const endTime = Date.now();
    const totalResponseTime = endTime - startTime;

    // Determine overall readiness
    const isReady = readinessChecks.database.ready;

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
      return NextResponse.json({
        success: true,
        data: readinessData,
        message: 'Application is ready',
        timestamp: new Date().toISOString()
      });
    } else {
      // Return 503 Service Unavailable if not ready
      return NextResponse.json({
        success: false,
        data: readinessData,
        message: 'Application is not ready',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Readiness check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to check application readiness',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

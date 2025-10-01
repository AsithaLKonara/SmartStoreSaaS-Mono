export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbManager from '@/lib/database';

// Readiness check - determines if the app is ready to serve traffic
export async function GET() {
  try {
    const startTime = Date.now();
    const readinessChecks = {
      database: false,
      api: true
    };

    // Check database readiness with retry logic
    const dbHealth = await dbManager.healthCheck();
    readinessChecks.database = dbHealth.status === 'healthy';

    const responseTime = Date.now() - startTime;

    if (!readinessChecks.database) {
      return NextResponse.json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        services: {
          database: 'unhealthy',
          api: 'healthy'
        },
        responseTime
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      services: {
        database: 'healthy',
        api: 'healthy'
      },
      responseTime
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: 'Readiness check failed'
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
import { NextResponse } from 'next/server';
import dbManager from '@/lib/database';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        app: 'running',
        database: 'unknown',
      }
    };

    // Database health check (simplified)
    let dbStatus = 'unknown';
    try {
      // Simple database ping - if this fails, database is down
      await dbManager.executeWithRetry(
        async (prisma) => await prisma.$queryRaw`SELECT 1`,
        'database health check'
      );
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }
    
    return NextResponse.json({
      ...healthData,
      services: {
        app: 'running',
        database: dbStatus,
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}
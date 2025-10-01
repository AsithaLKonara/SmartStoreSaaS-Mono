export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    const dbStart = Date.now();
    const userCount = await db.users.count();
    const orgCount = await db.organizations.count();
    const dbTime = Date.now() - dbStart;
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check uptime
    const uptime = process.uptime();
    
    // Check environment
    const environment = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV || 'development'
    };
    
    // Overall health check
    const isHealthy = dbTime < 5000 && userCount > 0; // DB should respond within 5s and have data
    
    const responseTime = Date.now() - startTime;
    
    const status = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.2.0',
      uptime: Math.floor(uptime),
      responseTime,
      database: {
        connected: true,
        responseTime: dbTime,
        users: userCount,
        organizations: orgCount
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      environment,
      checks: {
        database: dbTime < 5000,
        memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9, // Less than 90% heap usage
        uptime: uptime > 0
      }
    };
    
    return NextResponse.json(status, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.2.0',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: false,
        memory: false,
        uptime: false
      }
    }, { status: 503 });
  }
}

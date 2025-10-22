/**
 * Health Check API Route
 * 
 * Authorization:
 * - GET: Public (health check for monitoring)
 * 
 * Returns application health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime())
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    }, { status: 503 });
  }
}

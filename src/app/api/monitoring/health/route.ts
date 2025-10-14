/**
 * Health Check API Route
 * 
 * Authorization:
 * - GET: Public (health check endpoint)
 * 
 * Returns system health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: 'connected'
      };

      return NextResponse.json(successResponse(health));
    } catch (error: any) {
      logger.error({
        message: 'Health check failed',
        error: error
      });
      
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        error: error.message
      }, { status: 503 });
    }
  }
);

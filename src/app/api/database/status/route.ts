/**
 * Database Status API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_DB_STATUS permission)
 * 
 * System-wide: Database health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;

      logger.info({
        message: 'Database status checked',
        context: { userId: user.id, responseTime }
      });

      return NextResponse.json(successResponse({
        status: 'healthy',
        responseTime,
        connected: true,
        timestamp: new Date().toISOString()
      }));
    } catch (error: any) {
      logger.error({
        message: 'Database status check failed',
        error: error,
        context: { userId: user.id }
      });
      
      return NextResponse.json(successResponse({
        status: 'unhealthy',
        connected: false,
        error: error.message
      }), { status: 503 });
    }
  }
);

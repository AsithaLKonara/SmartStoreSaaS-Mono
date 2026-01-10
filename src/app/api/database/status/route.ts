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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/database/status
 * Database status check (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;

      logger.info({
        message: 'Database status checked',
        context: {
          userId: user.id,
          responseTime
        },
        correlation: req.correlationId
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
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json(successResponse({
        status: 'unhealthy',
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      }), { status: 503 });
    }
  }
);

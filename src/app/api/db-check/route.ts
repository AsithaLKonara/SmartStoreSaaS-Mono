import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/db-check
 * Database connection check (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      await prisma.$connect();
      
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      
      await prisma.$disconnect();

      logger.info({
        message: 'Database connection test successful',
        context: {
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        connected: true,
        test: result,
        message: 'Database connection successful'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Database connection test failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Database connection failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
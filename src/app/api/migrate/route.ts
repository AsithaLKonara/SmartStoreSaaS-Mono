/**
 * Database Migration API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (MANAGE_DB permission)
 * 
 * System-wide: Triggers database migrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/migrate
 * Trigger database migration (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'Database migration triggered',
        context: {
          userId: user.id
        },
        correlation: req.correlationId
      });

      // TODO: Run actual database migrations
      return NextResponse.json(successResponse({
        status: 'initiated',
        message: 'Database migration initiated'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Database migration failed',
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
        message: 'Database migration failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


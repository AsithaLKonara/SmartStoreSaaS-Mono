/**
 * Resolve Performance Alert API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (MANAGE_ALERTS permission)
 * 
 * Marks performance alert as resolved
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/performance/alerts/[id]/resolve
 * Resolve performance alert (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const alertId = params.id;
      const body = await req.json();
      const { resolution } = body;

      logger.info({
        message: 'Performance alert resolved',
        context: {
          userId: user.id,
          alertId,
          resolution
        },
        correlation: req.correlationId
      });

      const resolved = await prisma.productionAlert.update({
        where: { id: alertId },
        data: {
          status: 'RESOLVED' as any,
          resolvedAt: new Date(),
          resolvedBy: user.id,
        },
      });

      return NextResponse.json(successResponse({
        alertId: resolved.id,
        status: resolved.status,
        resolvedBy: resolved.resolvedBy,
        resolvedAt: resolved.resolvedAt,
      }));
    } catch (error: any) {
      logger.error({
        message: 'Alert resolution failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          alertId: params.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Alert resolution failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


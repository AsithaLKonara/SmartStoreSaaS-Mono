/**
 * Webhook Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WEBHOOKS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhooks/stats
 * Get webhook statistics
 */
export const GET = requirePermission(Permission.WEBHOOKS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const [total, successful, failed] = await Promise.all([
        prisma.activityLog.count({ where: { organizationId, type: 'WEBHOOK_DELIVERY' } }),
        prisma.activityLog.count({ where: { organizationId, type: 'WEBHOOK_DELIVERY', description: { contains: 'success', mode: 'insensitive' } } }),
        prisma.activityLog.count({ where: { organizationId, type: 'WEBHOOK_DELIVERY', description: { contains: 'fail', mode: 'insensitive' } } }),
      ]);

      logger.info({
        message: 'Webhook statistics fetched',
        context: { userId: user.id, organizationId },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        total,
        successful,
        failed,
        pending: 0 // Without an explicit job queue, we assume no pending
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhook statistics',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch webhook statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

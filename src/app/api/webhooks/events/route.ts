/**
 * Webhook Events API Route
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
 * GET /api/webhooks/events
 * Get webhook events
 */
export const GET = requirePermission(Permission.WEBHOOKS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const skip = (page - 1) * limit;
      const eventType = new URL(req.url).searchParams.get('type') || undefined;

      const [items, total] = await Promise.all([
        prisma.activityLog.findMany({
          where: {
            organizationId,
            type: { startsWith: 'WEBHOOK_' },
            ...(eventType ? { description: { contains: eventType } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.activityLog.count({
          where: { organizationId, type: { startsWith: 'WEBHOOK_' } },
        }),
      ]);

      logger.info({
        message: 'Webhook events fetched',
        context: { userId: user.id, organizationId, total },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(items, {
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhook events',
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
        message: 'Failed to fetch webhook events',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

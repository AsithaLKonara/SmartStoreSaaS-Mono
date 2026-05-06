import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const NotificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  isRead: z.enum(['true', 'false']).optional().transform(v => v ? v === 'true' : undefined),
  type: z.string().optional()
});

const NotificationUpdateSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'No notification IDs provided'),
  isRead: z.boolean()
});

/**
 * GET /api/notifications
 * Get notifications (VIEW_NOTIFICATIONS permission)
 */
export const GET = requirePermission(Permission.NOTIFICATIONS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      
      const parsed = NotificationQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        isRead: searchParams.get('isRead'),
        type: searchParams.get('type')
      });

      if (!parsed.success) {
         throw new ValidationError('Invalid query: ' + parsed.error.errors.map(e => e.message).join(', '));
      }

      const { page, limit, isRead, type } = parsed.data;

      logger.info({
        message: 'Notifications fetched',
        context: {
          userId: user.id,
          organizationId,
          page,
          limit,
          isRead: isReadParam,
          type
        },
        correlation: req.correlationId
      });

      // Build where clause
      const where: any = {
        userId: user.id // User-specific notifications
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            isRead: true,
            data: true,
            createdAt: true
          }
        }),
        prisma.notification.count({ where })
      ]);

      return NextResponse.json(successResponse({
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch notifications',
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
        message: 'Failed to fetch notifications',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * PUT /api/notifications
 * Update notifications (mark as read/unread)
 */
export const PUT = requirePermission(Permission.NOTIFICATIONS_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const jsonBody = await req.json();
      const parsed = NotificationUpdateSchema.safeParse(jsonBody);

      if (!parsed.success) {
        throw new ValidationError('Invalid update data: ' + parsed.error.errors.map(e => e.message).join(', '));
      }

      const { notificationIds, isRead } = parsed.data;

      logger.info({
        message: 'Notifications updated',
        context: {
          userId: user.id,
          notificationIds: notificationIds.length,
          isRead
        },
        correlation: req.correlationId
      });

      const updateResult = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id // Security: ensure user owns the notifications
        },
        data: {
          isRead
        }
      });

      return NextResponse.json(successResponse({
        message: 'Notifications updated successfully',
        updatedCount: updateResult.count,
        isRead
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update notifications',
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
        message: 'Failed to update notifications',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Get notifications (VIEW_NOTIFICATIONS permission)
 */
export const GET = requirePermission('VIEW_NOTIFICATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const isReadParam = searchParams.get('isRead');
      const type = searchParams.get('type');

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

      if (isReadParam !== null && isReadParam !== undefined) {
        where.isRead = isReadParam === 'true';
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
export const PUT = requirePermission('MANAGE_NOTIFICATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { notificationIds, isRead } = body;

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ValidationError('No notification IDs provided');
      }

      if (typeof isRead !== 'boolean') {
        throw new ValidationError('isRead must be a boolean');
      }

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
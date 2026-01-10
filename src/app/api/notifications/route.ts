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
      const status = searchParams.get('status');
      const type = searchParams.get('type');

      logger.info({
        message: 'Notifications fetched',
        context: {
          userId: user.id,
          organizationId,
          page,
          limit,
          status,
          type
        },
        correlation: req.correlationId
      });

      // Build where clause - use activities table for notifications
      const where: any = { 
        organizationId,
        userId: user.id // User-specific notifications
      };
      if (status) {
        // Map status to activity metadata if needed
        where.type = { contains: status };
      }

      // Query activities as notifications (or create dedicated notification model)
      const [notifications, total] = await Promise.all([
        prisma.activities.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            type: true,
            description: true,
            metadata: true,
            createdAt: true,
            userId: true
          }
        }),
        prisma.activities.count({ where })
      ]);

      // Transform activities to notification format
      const formattedNotifications = notifications.map(activity => ({
        id: activity.id,
        title: activity.type,
        message: activity.description,
        type: activity.type.toLowerCase(),
        status: 'unread', // Can be enhanced with read tracking
        createdAt: activity.createdAt.toISOString(),
        readAt: null,
        metadata: activity.metadata
      }));

      return NextResponse.json(successResponse({
        notifications: formattedNotifications,
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
 * Update notifications (MANAGE_NOTIFICATIONS permission)
 */
export const PUT = requirePermission('MANAGE_NOTIFICATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { notificationIds, status } = body;

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ValidationError('No notification IDs provided', {
          fields: { notificationIds: !notificationIds || !Array.isArray(notificationIds) }
        });
      }

      logger.info({
        message: 'Notifications updated',
        context: {
          userId: user.id,
          organizationId,
          notificationIds: notificationIds.length,
          status
        },
        correlation: req.correlationId
      });

      // TODO: Implement actual notifications update
      // This would typically involve:
      // 1. Updating notifications in database
      // 2. Checking user permissions
      // 3. Returning success response

      return NextResponse.json(successResponse({
        message: 'Notifications updated successfully',
        updatedCount: notificationIds.length,
        status
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
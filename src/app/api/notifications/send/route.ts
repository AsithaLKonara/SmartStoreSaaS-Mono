import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/send
 * Send notification (MANAGE_NOTIFICATIONS permission)
 */
export const POST = requirePermission(Permission.NOTIFICATIONS_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { recipients, title, message, type = 'info', data = {} } = body;

      // Validate required fields
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new ValidationError('No recipients provided');
      }

      if (!title || !message) {
        throw new ValidationError('Title and message are required');
      }

      logger.info({
        message: 'Notification sending started',
        context: {
          userId: user.id,
          organizationId,
          recipientCount: recipients.length,
          type
        },
        correlation: req.correlationId
      });

      // Prepare notification data objects
      const notificationsData = recipients.map((recipientId: string) => ({
        userId: recipientId,
        type,
        title,
        message,
        data,
        isRead: false
      }));

      // Bulk create notifications
      // Note: This creates DB records. Real-time delivery (WS/Push) logic would go here.
      const result = await prisma.notification.createMany({
        data: notificationsData
      });

      logger.info({
        message: 'Notifications stored in database',
        context: {
          count: result.count
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Notifications sent successfully',
        sentCount: result.count,
        recipients: recipients
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to send notification',
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
        message: 'Failed to send notification',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
/**
 * Single Notification API Route
 * 
 * Authorization:
 * - GET: Requires authentication (user can view own notification)
 * - DELETE: Requires authentication (user can delete own notification)
 * 
 * User Scoping: Users see only their own notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const notificationId = params.id;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new ValidationError('Notification not found');
      }

      // Verify ownership
      if (notification.userId !== user.id) {
        throw new ValidationError('Cannot view other users notifications');
      }

      logger.info({
        message: 'Notification fetched',
        context: { userId: user.id, notificationId }
      });

      return NextResponse.json(successResponse(notification));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch notification',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireAuth(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const notificationId = params.id;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new ValidationError('Notification not found');
      }

      // Verify ownership
      if (notification.userId !== user.id) {
        throw new ValidationError('Cannot delete other users notifications');
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      logger.info({
        message: 'Notification deleted',
        context: { userId: user.id, notificationId }
      });

      return NextResponse.json(successResponse({
        message: 'Notification deleted',
        notificationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete notification',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

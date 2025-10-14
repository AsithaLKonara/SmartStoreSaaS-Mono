/**
 * Notifications API Route
 * 
 * Authorization:
 * - GET: Requires authentication (users see own notifications)
 * - PATCH: Requires authentication (mark as read)
 * 
 * User Scoping: Users see only their own notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const unreadOnly = searchParams.get('unreadOnly') === 'true';

      const where: any = { userId: user.id };
      if (unreadOnly) {
        where.read = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      logger.info({
        message: 'Notifications fetched',
        context: { userId: user.id, count: notifications.length }
      });

      return NextResponse.json(successResponse(notifications));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch notifications',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PATCH = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { notificationIds, markAsRead = true } = body;

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id // Ensure user can only update their own
        },
        data: { read: markAsRead }
      });

      logger.info({
        message: 'Notifications updated',
        context: { userId: user.id, count: notificationIds.length }
      });

      return NextResponse.json(successResponse({
        updated: notificationIds.length,
        message: 'Notifications marked as read'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update notifications',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

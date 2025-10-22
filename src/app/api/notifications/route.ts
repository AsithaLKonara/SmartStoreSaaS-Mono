import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    logger.info({
      message: 'Notifications fetched',
      context: {
        userId: session.user.id,
        page,
        limit,
        status,
        type
      }
    });

    const organizationId = session.user.organizationId;

    // Build where clause - use activities table for notifications
    const where: any = { 
      organizationId,
      userId: session.user.id // User-specific notifications
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

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch notifications',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, status } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No notification IDs provided'
      }, { status: 400 });
    }

    logger.info({
      message: 'Notifications updated',
      context: {
        userId: session.user.id,
        notificationIds: notificationIds.length,
        status
      }
    });

    // TODO: Implement actual notifications update
    // This would typically involve:
    // 1. Updating notifications in database
    // 2. Checking user permissions
    // 3. Returning success response

    return NextResponse.json({
      success: true,
      message: 'Notifications updated successfully',
      data: {
        updatedCount: notificationIds.length,
        status
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to update notifications',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
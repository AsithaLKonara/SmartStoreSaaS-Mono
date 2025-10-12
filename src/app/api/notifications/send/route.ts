import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      userIds,
      organizationId,
      title,
      message,
      type = 'INFO',
      channel = 'IN_APP',
      data,
    } = body;

    // Validate required fields
    if ((!userId && !userIds) || !organizationId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Bulk send
    if (userIds && Array.isArray(userIds)) {
      const result = await notificationService.sendBulk(userIds, {
        organizationId,
        title,
        message,
        type,
        channel,
        data,
      });

      return NextResponse.json({
        success: result.success,
        sent: result.sent,
        failed: result.failed,
        total: result.total,
      });
    }

    // Single send
    const result = await notificationService.send({
      userId,
      organizationId,
      title,
      message,
      type,
      channel,
      data,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        results: result.results,
        message: 'Notification sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send notification',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}


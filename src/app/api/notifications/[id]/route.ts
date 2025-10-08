import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notificationManager } from '@/lib/notifications';
import { withErrorHandling } from '@/lib/error-handling';

export const dynamic = 'force-dynamic';

// Update notification status (mark as read, archived, etc.)
export const PATCH = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  
  try {
    const body = await request.json();
    const { action } = body; // 'read', 'archive', 'delete'

    let success = false;
    let message = '';

    switch (action) {
      case 'read':
        success = notificationManager.markAsRead(id);
        message = success ? 'Notification marked as read' : 'Failed to mark notification as read';
        break;
      case 'archive':
        success = notificationManager.markAsArchived(id);
        message = success ? 'Notification archived' : 'Failed to archive notification';
        break;
      case 'delete':
        success = notificationManager.deleteNotification(id);
        message = success ? 'Notification deleted' : 'Failed to delete notification';
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: read, archive, or delete'
        }, { status: 400 });
    }

    return NextResponse.json({
      success,
      message
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update notification'
    }, { status: 500 });
  }
});

// Get specific notification
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  
  try {
    const notifications = notificationManager.getUserNotifications(session.user.id);
    const notification = notifications.find(n => n.id === id);

    if (!notification) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notification'
    }, { status: 500 });
  }
});



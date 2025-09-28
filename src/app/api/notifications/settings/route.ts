import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/notifications/settings - Get notification settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.notificationSetting.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId
      }
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.notificationSetting.create({
        data: {
          userId: session.user.id,
          organizationId: session.user.organizationId!,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          orderNotifications: true,
          paymentNotifications: true,
          deliveryNotifications: true,
          systemNotifications: true,
          promotionNotifications: false
        }
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/settings - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      orderNotifications,
      paymentNotifications,
      deliveryNotifications,
      systemNotifications,
      promotionNotifications
    } = await request.json();

    // First try to find existing settings
    const existingSettings = await prisma.notificationSetting.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId
      }
    });

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.notificationSetting.update({
        where: {
          id: existingSettings.id
        },
        data: {
          emailEnabled,
          smsEnabled,
          pushEnabled,
          orderNotifications,
          paymentNotifications,
          deliveryNotifications,
          systemNotifications,
          promotionNotifications
        }
      });
    } else {
      // Create new settings
      settings = await prisma.notificationSetting.create({
        data: {
          userId: session.user.id,
          organizationId: session.user.organizationId!,
          emailEnabled: emailEnabled ?? true,
          smsEnabled: smsEnabled ?? false,
          pushEnabled: pushEnabled ?? true,
          orderNotifications: orderNotifications ?? true,
          paymentNotifications: paymentNotifications ?? true,
          deliveryNotifications: deliveryNotifications ?? true,
          systemNotifications: systemNotifications ?? true,
          promotionNotifications: promotionNotifications ?? false
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization settings that contain notification configuration
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Extract notification settings from organization settings
    const notificationSettings = organization.settings?.notifications || {
      email: {
        orderUpdates: true,
        inventoryAlerts: true,
        analyticsReports: true,
        marketingCampaigns: false
      },
      sms: {
        orderConfirmations: true,
        deliveryUpdates: true
      },
      push: {
        realTimeAlerts: true,
        aiInsights: true
      }
    };

    return NextResponse.json(notificationSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, sms, push } = body;

    // Validate notification settings structure
    if (!email || !sms || !push) {
      return NextResponse.json(
        { error: 'Invalid notification settings structure' },
        { status: 400 }
      );
    }

    // Get current organization settings
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update notification settings within organization settings
    const updatedSettings = {
      ...organization.settings,
      notifications: {
        email: {
          orderUpdates: !!email.orderUpdates,
          inventoryAlerts: !!email.inventoryAlerts,
          analyticsReports: !!email.analyticsReports,
          marketingCampaigns: !!email.marketingCampaigns
        },
        sms: {
          orderConfirmations: !!sms.orderConfirmations,
          deliveryUpdates: !!sms.deliveryUpdates
        },
        push: {
          realTimeAlerts: !!push.realTimeAlerts,
          aiInsights: !!push.aiInsights
        }
      }
    };

    // Update organization with new notification settings
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { settings: updatedSettings }
    });

    return NextResponse.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

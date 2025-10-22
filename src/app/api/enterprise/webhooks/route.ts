import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required role
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Add organization scoping
    const orgId = session.user.organizationId;

    logger.info({
      message: 'Webhooks fetched',
      context: { userId: session.user.id, organizationId: orgId }
    });

    // TODO: Implement webhooks fetching
    // This would typically involve querying webhooks from database
    const webhooks = [
      {
        id: 'webhook_1',
        name: 'Order Created Webhook',
        url: 'https://example.com/webhooks/orders',
        events: ['order.created', 'order.updated'],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ success: true, data: webhooks });
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch webhooks',
      error: error.message
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhooks',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required role
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const orgId = session.user.organizationId;

    logger.info({
      message: 'Webhook created',
      context: { userId: session.user.id, organizationId: orgId }
    });

    // TODO: Implement webhook creation
    // This would typically involve creating webhook in database
    const newWebhook = {
      id: 'webhook_new',
      name: body.name,
      url: body.url,
      events: body.events || [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: newWebhook }, { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create webhook',
      error: error.message
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create webhook',
      details: error.message
    }, { status: 500 });
  }
}
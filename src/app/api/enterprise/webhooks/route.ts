import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';
import crypto from 'crypto';

// GET - List webhooks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await db.webhook.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: webhooks });
  } catch (error) {
    apiLogger.error('Error fetching webhooks', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST - Create webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, events } = body;

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await db.webhook.create({
      data: {
        organizationId: session.user.organizationId,
        url,
        events: JSON.stringify(events),
        secret,
      },
    });

    apiLogger.info('Webhook created', { webhookId: webhook.id });

    return NextResponse.json({ success: true, data: webhook });
  } catch (error) {
    apiLogger.error('Error creating webhook', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create webhook' }, { status: 500 });
  }
}


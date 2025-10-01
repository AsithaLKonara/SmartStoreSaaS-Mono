import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List social commerce integrations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await db.socialCommerce.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: {
            catalogItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    apiLogger.error('Error fetching social commerce integrations', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST - Create social commerce integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      platform,
      accountName,
      accountId,
      accessToken,
      pageId,
      businessAccountId,
    } = body;

    const integration = await db.socialCommerce.create({
      data: {
        organizationId: session.user.organizationId,
        platform,
        accountName,
        accountId,
        accessToken,
        pageId,
        businessAccountId,
      },
    });

    apiLogger.info('Social commerce integration created', { integrationId: integration.id, platform });

    return NextResponse.json({ success: true, data: integration });
  } catch (error) {
    apiLogger.error('Error creating social commerce integration', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create integration' }, { status: 500 });
  }
}


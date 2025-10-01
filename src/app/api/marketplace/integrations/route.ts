import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List marketplace integrations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await db.marketplaceIntegration.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: {
            listings: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    apiLogger.error('Error fetching marketplace integrations', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST - Create marketplace integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      marketplace,
      accountName,
      accountId,
      apiKey,
      apiSecret,
      accessToken,
      defaultWarehouseId,
    } = body;

    const integration = await db.marketplaceIntegration.create({
      data: {
        organizationId: session.user.organizationId,
        marketplace,
        accountName,
        accountId,
        apiKey,
        apiSecret,
        accessToken,
        defaultWarehouseId,
      },
    });

    apiLogger.info('Marketplace integration created', { integrationId: integration.id, marketplace });

    return NextResponse.json({ success: true, data: integration });
  } catch (error) {
    apiLogger.error('Error creating marketplace integration', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create integration' }, { status: 500 });
  }
}


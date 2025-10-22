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

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const hours = parseInt(searchParams.get('hours') || '24');

    const organizationId = session.user.organizationId;

    // Calculate cutoff time for abandoned carts
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Query orders that are PENDING and older than cutoff (abandoned carts)
    const [abandonedOrders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          organizationId,
          status: 'PENDING',
          createdAt: { lte: cutoffTime }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { name: true, email: true }
          },
          items: {
            include: {
              product: {
                select: { name: true, price: true }
              }
            }
          }
        }
      }),
      prisma.order.count({
        where: {
          organizationId,
          status: 'PENDING',
          createdAt: { lte: cutoffTime }
        }
      })
    ]);

    logger.info({
      message: 'Abandoned carts fetched successfully',
      context: {
        userId: session.user.id,
        organizationId,
        count: abandonedOrders.length,
        total,
        hours,
        page,
        limit
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        abandonedCarts: abandonedOrders,
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
      message: 'Failed to fetch abandoned carts',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch abandoned carts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { cartIds, campaignType = 'email', templateId, delay = 0 } = body;

    if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No cart IDs provided'
      }, { status: 400 });
    }

    logger.info({
      message: 'Abandoned cart campaign initiated',
      context: {
        userId: session.user.id,
        cartIds: cartIds.length,
        campaignType,
        templateId,
        delay
      }
    });

    // TODO: Implement actual abandoned cart campaign logic
    // This would typically involve:
    // 1. Validating cart IDs
    // 2. Creating campaign records
    // 3. Scheduling emails/SMS based on delay
    // 4. Tracking campaign performance

    const campaign = {
      id: `campaign_${Date.now()}`,
      type: campaignType,
      cartIds,
      templateId,
      delay,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart campaign initiated',
      data: campaign
    });

  } catch (error: any) {
    logger.error({
      message: 'Abandoned cart campaign failed',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Abandoned cart campaign failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
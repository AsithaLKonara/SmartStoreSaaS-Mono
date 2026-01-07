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

    // Get loyalty programs
    const [loyaltyPrograms, total] = await Promise.all([
      prisma.customerLoyalty.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customerLoyalty.count()
    ]);

    logger.info({
      message: 'Loyalty programs fetched successfully',
      context: {
        userId: session.user.id,
        count: loyaltyPrograms.length,
        total
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        loyaltyPrograms,
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
      message: 'Failed to fetch loyalty programs',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch loyalty programs',
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
    const { customerId, points, action, description } = body;

    // Validate required fields
    if (!customerId || !points || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customerId, points, action'
      }, { status: 400 });
    }

    // Get or create customer loyalty record
    let customerLoyalty = await prisma.customerLoyalty.findFirst({
      where: { customerId }
    });

    if (!customerLoyalty) {
      customerLoyalty = await prisma.customerLoyalty.create({
        data: {
          customerId,
          points: 0
        }
      });
    }

    // Create loyalty transaction
    const loyaltyTransaction = await prisma.loyalty_transactions.create({
      data: {
        id: `loyalty_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId,
        loyaltyId: customerLoyalty.id,
        type: action,
        points: parseInt(points),
        description: description || ''
      }
    });

    logger.info({
      message: 'Loyalty transaction created successfully',
      context: {
        userId: session.user.id,
        customerId,
        points,
        action
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loyalty transaction created successfully',
      data: loyaltyTransaction
    }, { status: 201 });

  } catch (error: any) {
    logger.error({
      message: 'Failed to create loyalty transaction',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create loyalty transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
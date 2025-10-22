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
    const customerId = searchParams.get('customerId');

    const organizationId = session.user.organizationId;

    // Build where clause
    const where: any = { organizationId };
    if (customerId) where.referrerId = customerId;

    // Query referrals from database (using affiliate or create referral tracking)
    const [referrals, total] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          status: true,
          commissionRate: true,
          totalSales: true,
          totalCommission: true,
          createdAt: true
        }
      }),
      prisma.affiliate.count({ where })
    ]);

    logger.info({
      message: 'Referrals fetched successfully',
      context: {
        userId: session.user.id,
        organizationId,
        count: referrals.length,
        total,
        customerId,
        page,
        limit
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      note: 'Using affiliate system for referral tracking'
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch referrals',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch referrals',
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

    const body = await request.json();
    const { referrerId, refereeEmail, refereeName } = body;

    // Validate required fields
    if (!referrerId || !refereeEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: referrerId, refereeEmail'
      }, { status: 400 });
    }

    logger.info({
      message: 'Referral created',
      context: {
        userId: session.user.id,
        referrerId,
        refereeEmail
      }
    });

    // TODO: Implement actual referral creation logic
    // This would typically involve:
    // 1. Validating referrer exists
    // 2. Checking if referee already exists
    // 3. Creating referral record
    // 4. Sending referral email/SMS
    // 5. Setting up tracking

    const referral = {
      id: `ref_${Date.now()}`,
      referrerId,
      refereeEmail,
      refereeName: refereeName || null,
      status: 'pending',
      rewardAmount: 0.00,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    return NextResponse.json({
      success: true,
      message: 'Referral created successfully',
      data: referral
    }, { status: 201 });

  } catch (error: any) {
    logger.error({
      message: 'Failed to create referral',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create referral',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/loyalty - Get loyalty data
async function getLoyalty(request: AuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const type = searchParams.get('type'); // transactions, rewards, campaigns

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const organizationId = request.user!.organizationId;

    if (type === 'transactions') {
      const transactions = await prisma.loyaltyTransaction.findMany({
        where: {
          customerId,
          organizationId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json({ transactions });
    }

    if (type === 'rewards') {
      const rewards = await prisma.loyaltyReward.findMany({
        where: {
          organizationId,
          isActive: true
        },
        orderBy: {
          pointsRequired: 'asc'
        }
      });

      return NextResponse.json({ rewards });
    }

    if (type === 'campaigns') {
      const campaigns = await prisma.loyaltyCampaign.findMany({
        where: {
          organizationId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json({ campaigns });
    }

    // Get customer loyalty summary
    const [loyalty, transactions, rewards] = await Promise.all([
      prisma.customerLoyalty.findFirst({
        where: {
          customerId,
          organizationId
        }
      }),
      prisma.loyaltyTransaction.findMany({
        where: {
          customerId,
          organizationId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      prisma.loyaltyReward.findMany({
        where: {
          organizationId,
          isActive: true
        },
        orderBy: {
          pointsRequired: 'asc'
        }
      })
    ]);

    return NextResponse.json({
      loyalty,
      recentTransactions: transactions,
      availableRewards: rewards
    });
  } catch (error) {
    console.error('Error fetching loyalty data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/loyalty - Add loyalty points
async function addLoyaltyPoints(request: AuthRequest) {
  try {

    const {
      customerId,
      points,
      reason,
      orderId,
      productId,
      campaignId,
      expiresAt
    } = await request.json();

    if (!customerId || !points || !reason) {
      return NextResponse.json({ error: 'Customer ID, points, and reason required' }, { status: 400 });
    }

    const organizationId = request.user!.organizationId;

    // Create loyalty transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        organizationId,
        type: 'EARNED',
        points,
        reason,
        orderId,
        productId,
        campaignId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Update customer loyalty points
    await prisma.customerLoyalty.upsert({
      where: {
        customerId
      },
      update: {
        points: {
          increment: points
        }
      },
      create: {
        customerId,
        organizationId,
        points,
        tier: 'BRONZE'
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/loyalty - Redeem loyalty points
async function redeemLoyaltyPoints(request: AuthRequest) {
  try {

    const { customerId, rewardId, points } = await request.json();

    if (!customerId || !rewardId || !points) {
      return NextResponse.json({ error: 'Customer ID, reward ID, and points required' }, { status: 400 });
    }

    const organizationId = request.user!.organizationId;

    // Check if customer has enough points
    const loyalty = await prisma.customerLoyalty.findFirst({
      where: {
        customerId,
        organizationId
      }
    });

    if (!loyalty || loyalty.points < points) {
      return NextResponse.json({ error: 'Insufficient loyalty points' }, { status: 400 });
    }

    // Get reward details
    const reward = await prisma.loyaltyReward.findFirst({
      where: {
        id: rewardId,
        organizationId,
        isActive: true
      }
    });

    if (!reward) {
      return NextResponse.json({ error: 'Invalid reward' }, { status: 400 });
    }

    // Create redemption transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        organizationId,
        type: 'REDEEMED',
        points: -points,
        reason: `Redeemed reward: ${reward.name}`
      }
    });

    // Update customer loyalty points
    await prisma.customerLoyalty.update({
      where: {
        customerId
      },
      data: {
        points: {
          decrement: points
        }
      }
    });

    return NextResponse.json({
      transaction,
      reward
    });
  } catch (error) {
    console.error('Error redeeming loyalty points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export protected handlers with security middleware
export const GET = createAuthHandler(getLoyalty, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.CUSTOMERS_READ],
});

export const POST = createAuthHandler(addLoyaltyPoints, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.CUSTOMERS_WRITE],
});

export const PUT = createAuthHandler(redeemLoyaltyPoints, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.CUSTOMERS_WRITE],
});
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get customer loyalty information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const customerId = searchParams.get('customerId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    if (customerId) {
      // Get specific customer loyalty
      const loyalty = await prisma.customerLoyalty.findUnique({
        where: { customerId },
        include: {
          customer: true,
        },
      });

      if (!loyalty) {
        return NextResponse.json({
          success: false,
          message: 'Customer loyalty not found',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: loyalty,
      });
    } else {
      // Get all customer loyalty for organization
      const loyalty = await prisma.customerLoyalty.findMany({
        where: { organizationId },
        include: {
          customer: true,
        },
        orderBy: { points: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: loyalty,
      });
    }
  } catch (error) {
    console.error('Customer loyalty API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update customer loyalty
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      organizationId,
      points,
      tier,
      totalSpent,
      totalOrders,
    } = body;

    if (!customerId || !organizationId) {
      return NextResponse.json({
        error: 'Customer ID and Organization ID are required',
      }, { status: 400 });
    }

    // Calculate tier based on points if not provided
    let calculatedTier = tier;
    if (!calculatedTier) {
      if (points >= 10000) calculatedTier = 'PLATINUM';
      else if (points >= 5000) calculatedTier = 'GOLD';
      else if (points >= 1000) calculatedTier = 'SILVER';
      else calculatedTier = 'BRONZE';
    }

    // Calculate tier expiry (1 year from now)
    const tierExpiryDate = new Date();
    tierExpiryDate.setFullYear(tierExpiryDate.getFullYear() + 1);

    // Create or update loyalty
    const loyalty = await prisma.customerLoyalty.upsert({
      where: { customerId },
      update: {
        points: points || 0,
        tier: calculatedTier,
        totalSpent: totalSpent || 0,
        totalOrders: totalOrders || 0,
        tierExpiryDate,
        updatedAt: new Date(),
      },
      create: {
        customerId,
        organizationId,
        points: points || 0,
        tier: calculatedTier,
        totalSpent: totalSpent || 0,
        totalOrders: totalOrders || 0,
        tierExpiryDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer loyalty updated successfully',
      data: loyalty,
    });
  } catch (error) {
    console.error('Customer loyalty update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Add points to customer loyalty
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, points, reason, orderId } = body;

    if (!customerId || !points) {
      return NextResponse.json({
        error: 'Customer ID and points are required',
      }, { status: 400 });
    }

    // Get current loyalty
    const currentLoyalty = await prisma.customerLoyalty.findUnique({
      where: { customerId },
    });

    if (!currentLoyalty) {
      return NextResponse.json({
        error: 'Customer loyalty not found',
      }, { status: 404 });
    }

    // Calculate new points and tier
    const newPoints = currentLoyalty.points + points;
    let newTier = currentLoyalty.tier;
    
    if (newPoints >= 10000) newTier = 'PLATINUM';
    else if (newPoints >= 5000) newTier = 'GOLD';
    else if (newPoints >= 1000) newTier = 'SILVER';
    else newTier = 'BRONZE';

    // Update loyalty
    const updatedLoyalty = await prisma.customerLoyalty.update({
      where: { customerId },
      data: {
        points: newPoints,
        tier: newTier,
        tierExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        updatedAt: new Date(),
      },
    });

    // Log points transaction (you could create a separate table for this)
    console.log(`Points added: ${points} to customer ${customerId}. Reason: ${reason}. Order: ${orderId}`);

    return NextResponse.json({
      success: true,
      message: 'Points added successfully',
      data: {
        previousPoints: currentLoyalty.points,
        newPoints: updatedLoyalty.points,
        pointsAdded: points,
        previousTier: currentLoyalty.tier,
        newTier: updatedLoyalty.tier,
        loyalty: updatedLoyalty,
      },
    });
  } catch (error) {
    console.error('Points addition error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

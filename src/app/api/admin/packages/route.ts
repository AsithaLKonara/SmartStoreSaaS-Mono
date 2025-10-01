export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbManager from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const packages = await dbManager.executeWithRetry(
      async (prisma) => await prisma.package.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      'fetch packages'
    );

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      currency = 'LKR',
      billingCycle = 'MONTHLY',
      features = {},
      isActive = true,
      isTrial = false,
      trialDays = 30,
      maxUsers,
      maxOrders,
      maxStorage
    } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const newPackage = await dbManager.executeWithRetry(
      async (prisma) => await prisma.package.create({
        data: {
          name,
          description,
          price,
          currency,
          billingCycle,
          features,
          isActive,
          isTrial,
          trialDays,
          maxUsers,
          maxOrders,
          maxStorage
        }
      }),
      'create package'
    );

    return NextResponse.json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}



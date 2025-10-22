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
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const weight = parseFloat(searchParams.get('weight') || '1');
    const dimensions = searchParams.get('dimensions');

    if (!origin || !destination) {
      return NextResponse.json({
        success: false,
        error: 'Origin and destination are required'
      }, { status: 400 });
    }

    logger.info({
      message: 'Shipping rates requested',
      context: {
        userId: session.user.id,
        origin,
        destination,
        weight
      }
    });

    const organizationId = session.user.organizationId;

    // Get shipping configuration from organization settings
    const shippingConfig = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { 
        settings: true,
        country: true 
      }
    });

    // Calculate shipping rates based on weight and distance
    // Using basic calculation - can be enhanced with actual shipping provider APIs
    const baseRate = 5.99;
    const weightRate = weight ? weight * 2.5 : 0;
    const standardCost = baseRate + weightRate;

    const shippingRates = [
      {
        id: 'rate_standard',
        provider: 'Standard Shipping',
        service: 'Ground',
        estimatedDays: '3-5',
        cost: Math.round(standardCost * 100) / 100,
        currency: 'USD'
      },
      {
        id: 'rate_express',
        provider: 'Express Shipping',
        service: '2-Day',
        estimatedDays: '2',
        cost: Math.round(standardCost * 2 * 100) / 100,
        currency: 'USD'
      },
      {
        id: 'rate_overnight',
        provider: 'Overnight Shipping',
        service: 'Next Day',
        estimatedDays: '1',
        cost: Math.round(standardCost * 3.5 * 100) / 100,
        currency: 'USD'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        rates: shippingRates,
        origin,
        destination,
        weight,
        dimensions
      },
      note: 'Basic calculation - integrate with Shippo/ShipStation API for real carrier rates'
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to calculate shipping rates',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate shipping rates',
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
    const { name, baseRate, perKgRate, freeShippingThreshold, isActive } = body;

    // Validate required fields
    if (!name || baseRate === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Name and base rate are required'
      }, { status: 400 });
    }

    logger.info({
      message: 'Shipping rate created',
      context: {
        userId: session.user.id,
        name,
        baseRate
      }
    });

    // TODO: Implement actual shipping rate creation
    // This would typically involve:
    // 1. Validating rate data
    // 2. Creating rate in database
    // 3. Updating shipping configuration
    // 4. Returning created rate

    const shippingRate = {
      id: `rate_${Date.now()}`,
      name,
      baseRate: parseFloat(baseRate),
      perKgRate: perKgRate ? parseFloat(perKgRate) : 0,
      freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Shipping rate created successfully',
      data: shippingRate
    }, { status: 201 });

  } catch (error: any) {
    logger.error({
      message: 'Failed to create shipping rate',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create shipping rate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
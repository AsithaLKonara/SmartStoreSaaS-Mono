import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const where = organizationId ? { organizationId } : {};

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        organization: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      subscriptions,
      data: subscriptions
    });
  } catch (error: any) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, planType, status, startDate, endDate } = body;

    const subscription = await prisma.subscription.create({
      data: {
        organizationId,
        planType: planType || 'FREE',
        status: status || 'ACTIVE',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      include: {
        organization: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      subscription,
      data: subscription
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, planType, endDate } = body;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(planType && { planType }),
        ...(endDate && { endDate: new Date(endDate) })
      }
    });

    return NextResponse.json({
      success: true,
      subscription,
      data: subscription
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

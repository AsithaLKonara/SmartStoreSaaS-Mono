import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const orders = await prisma.order.findMany({
      where: { customerId: session.user.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    const total = await prisma.order.count({
      where: { customerId: session.user.id }
    });

    logger.info({
      message: 'Customer orders fetched',
      context: { userId: session.user.id, count: orders.length }
    });

    return NextResponse.json({
      success: true,
      data: { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch customer orders', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch customer orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer cannot create orders directly',
      status: 'use_checkout_endpoint'
    });
  } catch (error: any) {
    logger.error({ message: 'Failed to process customer order creation request', error: error.message });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
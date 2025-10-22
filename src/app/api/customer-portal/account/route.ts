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

    const customer = await prisma.customer.findUnique({
      where: { id: session.user.id },
      include: {
        loyalty: true
      }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch customer account', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch customer account' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updated = await prisma.customer.update({
      where: { id: session.user.id },
      data: body
    });

    logger.info({ message: 'Customer account updated', context: { userId: session.user.id } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error({ message: 'Failed to update customer account', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to update customer account' }, { status: 500 });
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
      message: 'Use PUT to update account',
      status: 'use_put_method'
    });
  } catch (error: any) {
    logger.error({ message: 'Failed to process POST request', error: error.message });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
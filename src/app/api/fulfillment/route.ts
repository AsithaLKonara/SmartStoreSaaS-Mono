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

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const fulfillments = await prisma.delivery.findMany({
      where: { organizationId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.delivery.count({
      where: { organizationId: session.user.organizationId }
    });

    return NextResponse.json({
      success: true,
      data: { fulfillments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch fulfillments', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch fulfillments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fulfillment = await prisma.delivery.create({
      data: {
        ...body,
        organizationId: session.user.organizationId
      }
    });

    logger.info({ message: 'Fulfillment created', context: { fulfillmentId: fulfillment.id } });
    return NextResponse.json({ success: true, data: fulfillment });
  } catch (error: any) {
    logger.error({ message: 'Failed to create fulfillment', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to create fulfillment' }, { status: 500 });
  }
}
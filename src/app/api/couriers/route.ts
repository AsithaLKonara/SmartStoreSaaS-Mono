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

    const couriers = await prisma.courier.findMany({
      where: { organizationId: session.user.organizationId! },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.courier.count({
      where: { organizationId: session.user.organizationId! }
    });

    return NextResponse.json({
      success: true,
      data: { couriers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch couriers', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch couriers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const courier = await prisma.courier.create({
      data: {
        ...body,
        organizationId: session.user.organizationId!
      }
    });

    logger.info({ message: 'Courier created', context: { courierId: courier.id } });
    return NextResponse.json({ success: true, data: courier });
  } catch (error: any) {
    logger.error({ message: 'Failed to create courier', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to create courier' }, { status: 500 });
  }
}
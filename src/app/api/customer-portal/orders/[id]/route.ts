import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { 
        id: params.id,
        customerId: session.user.id
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        deliveries: true
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    logger.info({
      message: 'Customer order fetched',
      context: { userId: session.user.id, orderId: params.id }
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch customer order', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch customer order' }, { status: 500 });
  }
}
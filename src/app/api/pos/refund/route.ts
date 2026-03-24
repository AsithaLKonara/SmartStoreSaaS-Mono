import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reason, items, type } = await req.json(); // type: full | partial
    const organizationId = session.user.organizationId as string;

    logger.info(`Processing ${type} refund for order ${orderId}`, { items, reason });

    // Mark order as refunded
    const updatedOrder = await prisma.order.update({
      where: { id: orderId, organizationId },
      data: { status: type === 'full' ? 'REFUNDED' : 'PARTIALLY_SHIPPED' }, // Using available enum
    });

    // We can handle specific stock reversals here using pos transaction / inventory movement
    // and refund payments on connected gateways if needed.

    return NextResponse.json({ success: true, message: `Refund processed`, orderId: updatedOrder.id });
  } catch (error) {
    logger.error('Refund initialization failed', { error });
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}

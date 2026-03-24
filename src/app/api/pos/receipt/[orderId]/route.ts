import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.orderId;
    const organizationId = session.user.organizationId as string;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId,
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: true,
        creator: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Usually you would serialize exactly what the receipt printer needs
    // or return HTML/PDF for standard printers.
    const receiptData = {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      items: order.orderItems.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        price: item.price,
        total: item.total,
      })),
      cashier: order.creator?.name || 'Admin',
      customer: order.customer?.name || 'Guest',
      // Store/Org details could be injected here
    };

    return NextResponse.json({ success: true, data: receiptData });
  } catch (error) {
    logger.error('Failed to generate receipt', { error });
    return NextResponse.json({ error: 'Failed to fetch receipt data' }, { status: 500 });
  }
}

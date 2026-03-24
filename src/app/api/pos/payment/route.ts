import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, method, terminalId, orderId } = await req.json();
    const organizationId = session.user.organizationId as string;

    logger.info(`Processing payment of $${amount} via ${method} on terminal ${terminalId}`);

    // This records a generic payment, which is linked to an order
    const payment = await prisma.payment.create({
      data: {
        orderId,
        organizationId,
        amount,
        method,
        status: 'PAID', // Assuming synchronous success for POS
        currency: 'USD',
      }
    });

    return NextResponse.json({ success: true, paymentId: payment.id, message: 'Payment recorded successfully' });
  } catch (error) {
    logger.error('Failed to record payment', { error });
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}

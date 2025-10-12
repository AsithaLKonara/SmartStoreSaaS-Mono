export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List abandoned carts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const carts = await db.abandonedCart.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        customer: true,
      },
      orderBy: { abandonedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: carts });
  } catch (error) {
    apiLogger.error('Error fetching abandoned carts', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch abandoned carts' }, { status: 500 });
  }
}

// POST - Track abandoned cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, customerEmail, cartData, totalValue } = body;

    const cart = await db.abandonedCart.create({
      data: {
        organizationId: session.user.organizationId,
        customerId,
        customerEmail,
        cartData: JSON.stringify(cartData),
        totalValue: parseFloat(totalValue),
      },
    });

    apiLogger.info('Abandoned cart tracked', { cartId: cart.id });

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    apiLogger.error('Error tracking abandoned cart', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to track cart' }, { status: 500 });
  }
}


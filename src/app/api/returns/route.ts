import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List return requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const returns = await db.returnRequest.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        customer: true,
        order: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: returns });
  } catch (error) {
    apiLogger.error('Error fetching returns', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch returns' }, { status: 500 });
  }
}

// POST - Create return request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, customerId, reason, items, refundMethod } = body;

    // Generate return number
    const count = await db.returnRequest.count({
      where: { organizationId: session.user.organizationId },
    });
    const returnNumber = `RET-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const returnRequest = await db.returnRequest.create({
      data: {
        organizationId: session.user.organizationId,
        orderId,
        customerId,
        returnNumber,
        reason,
        refundMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            refundAmount: parseFloat(item.refundAmount),
            condition: item.condition,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    apiLogger.info('Return request created', { returnId: returnRequest.id, returnNumber });

    return NextResponse.json({ success: true, data: returnRequest });
  } catch (error) {
    apiLogger.error('Error creating return request', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create return request' }, { status: 500 });
  }
}


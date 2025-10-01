import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - List RFQs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const rfqs = await db.rFQ.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        items: true,
        responses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: rfqs });
  } catch (error) {
    apiLogger.error('Error fetching RFQs', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch RFQs' }, { status: 500 });
  }
}

// POST - Create RFQ
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, items } = body;

    const count = await db.rFQ.count({
      where: { organizationId: session.user.organizationId },
    });
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const rfq = await db.rFQ.create({
      data: {
        organizationId: session.user.organizationId,
        rfqNumber,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: session.user.id,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            specifications: item.specifications,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    apiLogger.info('RFQ created', { rfqId: rfq.id, rfqNumber });

    return NextResponse.json({ success: true, data: rfq });
  } catch (error) {
    apiLogger.error('Error creating RFQ', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to create RFQ' }, { status: 500 });
  }
}

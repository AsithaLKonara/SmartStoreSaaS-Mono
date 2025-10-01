import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - Get purchase order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        invoices: true,
      },
    });

    if (!purchaseOrder || purchaseOrder.organizationId !== session.user.organizationId) {
      return NextResponse.json({ success: false, message: 'Purchase order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: purchaseOrder });
  } catch (error) {
    apiLogger.error('Error fetching purchase order', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch purchase order' }, { status: 500 });
  }
}

// PUT - Update purchase order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, trackingNumber, receivedDate } = body;

    const purchaseOrder = await db.purchaseOrder.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        ...(status && { status }),
        ...(trackingNumber && { trackingNumber }),
        ...(receivedDate && { receivedDate: new Date(receivedDate) }),
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    apiLogger.info('Purchase order updated', { poId: purchaseOrder.id, status });

    return NextResponse.json({ success: true, data: purchaseOrder });
  } catch (error) {
    apiLogger.error('Error updating purchase order', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to update purchase order' }, { status: 500 });
  }
}


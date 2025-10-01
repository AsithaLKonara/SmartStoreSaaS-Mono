export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

// GET - Get supplier by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await db.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        products: true,
        _count: {
          select: {
            purchaseOrders: true,
            supplierInvoices: true,
          },
        },
      },
    });

    if (!supplier || supplier.organizationId !== session.user.organizationId) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    apiLogger.error('Error fetching supplier', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch supplier' }, { status: 500 });
  }
}

// PUT - Update supplier
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

    const supplier = await db.supplier.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: body,
    });

    apiLogger.info('Supplier updated', { supplierId: supplier.id });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    apiLogger.error('Error updating supplier', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to update supplier' }, { status: 500 });
  }
}

// DELETE - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await db.supplier.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    apiLogger.info('Supplier deleted', { supplierId: params.id });

    return NextResponse.json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    apiLogger.error('Error deleting supplier', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to delete supplier' }, { status: 500 });
  }
}


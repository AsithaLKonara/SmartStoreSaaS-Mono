export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PUT - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Purchase order ID is required' },
        { status: 400 }
      );
    }

    // Verify purchase order belongs to organization
    const existingPO = await prisma.purchase_orders.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Only allow updates for DRAFT status
    if (existingPO.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, message: 'Only draft purchase orders can be updated' },
        { status: 400 }
      );
    }

    const purchaseOrder = await prisma.purchase_orders.update({
      where: { id },
      data: updateData,
      include: {
        suppliers: true,
        purchase_order_items: {
          include: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Purchase order ID is required' },
        { status: 400 }
      );
    }

    // Verify purchase order belongs to organization
    const existingPO = await prisma.purchase_orders.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion for DRAFT status
    if (existingPO.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, message: 'Only draft purchase orders can be deleted' },
        { status: 400 }
      );
    }

    // Delete purchase order and related items in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete purchase order items first
      await tx.purchase_order_items.deleteMany({
        where: { purchaseOrderId: id },
      });

      // Delete purchase order
      await tx.purchase_orders.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
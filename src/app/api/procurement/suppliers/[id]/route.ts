export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PUT - Update supplier
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
        { success: false, message: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Verify supplier belongs to organization
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      );
    }

    const supplier = await prisma.suppliers.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier
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
        { success: false, message: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Verify supplier belongs to organization
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if supplier has purchase orders
    const poCount = await prisma.purchase_orders.count({
      where: { supplierId: id },
    });

    if (poCount > 0) {
      // Soft delete
      await prisma.suppliers.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Supplier deactivated (has purchase orders)',
      });
    } else {
      // Hard delete
      await prisma.suppliers.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
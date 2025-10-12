export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';

// PUT - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to organization
    const existingCustomer = await db.customer.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailExists = await db.customer.findFirst({
        where: {
          email: updateData.email,
          organizationId: session.user.organizationId,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to organization
    const existingCustomer = await db.customer.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has orders
    const orderCount = await db.order.count({
      where: { customerId: id }
    });

    if (orderCount > 0) {
      // Soft delete
      await db.customer.update({
        where: { id },
        data: { status: 'inactive' }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deactivated (has orders)'
      });
    } else {
      // Hard delete
      await db.customer.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    }

  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

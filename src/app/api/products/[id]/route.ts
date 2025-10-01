export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';

// PUT - Update product
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
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product belongs to organization
    const existingProduct = await db.product.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        variants: true,
        images: true
      }
    });

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
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
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product belongs to organization
    const existingProduct = await db.product.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has orders
    const orderCount = await db.orderItem.count({
      where: { productId: id }
    });

    if (orderCount > 0) {
      // Soft delete
      await db.product.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Product deactivated (has orders)'
      });
    } else {
      // Hard delete
      await db.product.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Product deleted successfully'
      });
    }

  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

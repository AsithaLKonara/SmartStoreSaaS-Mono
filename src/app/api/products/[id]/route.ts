import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    // Get product with related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true
      }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    logger.info({
      message: 'Product fetched successfully',
      context: {
        userId: session.user.id,
        productId
      }
    });

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch product',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const productId = params.id;
    const body = await request.json();
    const { name, description, price, cost, sku, barcode, categoryId, stockQuantity, minStockLevel, maxStockLevel, isActive } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(sku && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(categoryId && { categoryId }),
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
        ...(minStockLevel !== undefined && { minStockLevel: parseInt(minStockLevel) }),
        ...(maxStockLevel !== undefined && { maxStockLevel: parseInt(maxStockLevel) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    });

    logger.info({
      message: 'Product updated successfully',
      context: {
        userId: session.user.id,
        productId,
        changes: Object.keys(body)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to update product',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update product',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const productId = params.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId }
    });

    logger.info({
      message: 'Product deleted successfully',
      context: {
        userId: session.user.id,
        productId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      data: { productId }
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to delete product',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete product',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
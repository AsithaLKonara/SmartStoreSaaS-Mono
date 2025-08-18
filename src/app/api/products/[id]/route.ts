import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProtection, AuthenticatedRequest } from '@/lib/middleware/auth';
import { z } from 'zod';

// Product update schema
const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
  slug: z.string().min(2, 'Product slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  sku: z.string().min(2, 'SKU must be at least 2 characters').optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  stockQuantity: z.number().int().nonnegative('Stock quantity must be non-negative').optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/products/[id] - Get product by ID
async function getProduct(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        }
      }
      // Temporarily removed createdBy include to debug 500 error
      // include: {
      //   createdBy: {
      //     select: { id: true, name: true, email: true }
      //   }
      // }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (Admin/Manager only)
async function updateProduct(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const body = await request.json();

    // Validate input
    const validationResult = updateProductSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if product exists and belongs to user's organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        organization: {
          id: request.user!.organizationId
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Check for SKU conflicts if updating SKU
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: {
          sku: updateData.sku,
          organization: {
            id: request.user!.organizationId
          },
          id: { not: productId }
        }
      });

      if (skuConflict) {
        return NextResponse.json(
          { success: false, message: 'SKU already exists in this organization' },
          { status: 409 }
        );
      }
    }

    // Check for slug conflicts if updating slug
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: updateData.slug,
          organization: {
            id: request.user!.organizationId
          },
          id: { not: productId }
        }
      });

      if (slugConflict) {
        return NextResponse.json(
          { success: false, message: 'Product slug already exists in this organization' },
          { status: 409 }
        );
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
      // Temporarily removed createdBy include to debug 500 error
      // include: {
      //   createdBy: {
      //     select: { id: true, name: true, email: true }
      //   }
      // }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_UPDATED',
        description: `Product "${updatedProduct.name}" updated`,
        userId: request.user!.userId,
        metadata: {
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          changes: Object.keys(updateData)
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { product: updatedProduct },
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (Admin only)
async function deleteProduct(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // Check if product exists and belongs to user's organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        organization: {
          id: request.user!.organizationId
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Check if product has associated orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId }
    });

    if (orderItems) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete product with existing orders. Consider deactivating instead.' 
        },
        { status: 400 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_DELETED',
        description: `Product "${existingProduct.name}" deleted`,
        userId: request.user!.userId,
        metadata: {
          productId: existingProduct.id,
          productName: existingProduct.name,
          sku: existingProduct.sku
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = getProduct;
export const PUT = withProtection(['ADMIN', 'MANAGER'])(async (request: AuthenticatedRequest) => {
  const params = { id: request.nextUrl.pathname.split('/').pop()! };
  return updateProduct(request, { params });
});
export const DELETE = withProtection(['ADMIN'])(async (request: AuthenticatedRequest) => {
  const params = { id: request.nextUrl.pathname.split('/').pop()! };
  return deleteProduct(request, { params });
});

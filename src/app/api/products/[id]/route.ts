import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

async function handler(request: AuthRequest, { params }: RouteParams) {
  try {
    const user = request.user!;
    const { id } = params;

    switch (request.method) {
      case 'GET':
        // Get specific product
        const product = await prisma.product.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                cost: true,
                stock: true,
                weight: true,
                dimensions: true,
                isActive: true,
                createdAt: true,
              },
            },
            orderItems: {
              select: {
                id: true,
                quantity: true,
                price: true,
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    createdAt: true,
                  },
                },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ product });

      case 'PUT':
        // Update product
        const updateBody = await request.json();
        const { 
          name, 
          description, 
          price, 
          cost, 
          stock, 
          minStock, 
          weight, 
          dimensions, 
          tags, 
          categoryId,
          isActive 
        } = updateBody;

        // Check if product exists and belongs to same organization
        const existingProduct = await prisma.product.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
        });

        if (!existingProduct) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (minStock !== undefined) updateData.minStock = parseInt(minStock);
        if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
        if (dimensions !== undefined) updateData.dimensions = dimensions ? JSON.stringify(dimensions) : null;
        if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedProduct = await prisma.product.update({
          where: { id },
          data: updateData,
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stock: true,
                isActive: true,
              },
            },
          },
        });

        return NextResponse.json({
          message: 'Product updated successfully',
          product: updatedProduct,
        });

      case 'DELETE':
        // Soft delete product (set isActive to false)
        const productToDelete = await prisma.product.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
        });

        if (!productToDelete) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        // Check if product has active orders
        const activeOrderItems = await prisma.orderItem.findMany({
          where: {
            productId: id,
            order: {
              status: {
                in: ['PENDING', 'PROCESSING', 'SHIPPED'],
              },
            },
          },
        });

        if (activeOrderItems.length > 0) {
          return NextResponse.json(
            { error: 'Cannot delete product with active orders' },
            { status: 400 }
          );
        }

        await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });

        return NextResponse.json({
          message: 'Product deactivated successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

export const PUT = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_WRITE],
});

export const DELETE = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.PRODUCTS_DELETE],
});
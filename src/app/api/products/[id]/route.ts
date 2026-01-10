import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]
 * Get single product (VIEW_PRODUCTS permission)
 */
export const GET = requirePermission('VIEW_PRODUCTS')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const productId = params.id;

      // Get product with related data
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true
        }
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      // Validate organization access
      await validateOrganizationAccess(user, product.organizationId);

      logger.info({
        message: 'Product fetched successfully',
        context: {
          userId: user.id,
          organizationId: product.organizationId,
          productId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(product));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch product',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          productId: params.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch product',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * PUT /api/products/[id]
 * Update product (MANAGE_PRODUCTS permission)
 */
export const PUT = requirePermission('MANAGE_PRODUCTS')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const productId = params.id;
      const body = await req.json();
      const { name, description, price, cost, sku, barcode, categoryId, stockQuantity, minStockLevel, maxStockLevel, isActive } = body;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!existingProduct) {
        throw new NotFoundError('Product not found');
      }

      // Validate organization access
      await validateOrganizationAccess(user, existingProduct.organizationId);

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
          userId: user.id,
          organizationId: existingProduct.organizationId,
          productId,
          changes: Object.keys(body)
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Product updated successfully',
        data: updatedProduct
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update product',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          productId: params.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to update product',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/products/[id]
 * Delete product (MANAGE_PRODUCTS permission)
 */
export const DELETE = requirePermission('MANAGE_PRODUCTS')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const productId = params.id;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      // Validate organization access
      await validateOrganizationAccess(user, product.organizationId);

      // Delete product
      await prisma.product.delete({
        where: { id: productId }
      });

      logger.info({
        message: 'Product deleted successfully',
        context: {
          userId: user.id,
          organizationId: product.organizationId,
          productId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Product deleted successfully',
        productId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete product',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          productId: params.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to delete product',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
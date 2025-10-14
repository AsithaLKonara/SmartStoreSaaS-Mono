/**
 * Single Product API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (VIEW_PRODUCTS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PRODUCTS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_PRODUCTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const productId = params.id;

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ValidationError('Product not found');
      }

      // Verify organization ownership (except CUSTOMER can view all)
      if (user.role !== 'CUSTOMER' && product.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view products from other organizations');
      }

      logger.info({
        message: 'Product fetched',
        context: { userId: user.id, productId }
      });

      return NextResponse.json(successResponse(product));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch product',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const productId = params.id;
      const body = await request.json();

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ValidationError('Product not found');
      }

      if (product.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update products from other organizations');
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: body
      });

      logger.info({
        message: 'Product updated',
        context: { userId: user.id, productId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update product',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const productId = params.id;

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ValidationError('Product not found');
      }

      if (product.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete products from other organizations');
      }

      await prisma.product.delete({
        where: { id: productId }
      });

      logger.info({
        message: 'Product deleted',
        context: { userId: user.id, productId }
      });

      return NextResponse.json(successResponse({
        message: 'Product deleted',
        productId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete product',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

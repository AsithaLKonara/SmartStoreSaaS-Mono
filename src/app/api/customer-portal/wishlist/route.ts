/**
 * Customer Portal Wishlist API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (view own wishlist)
 * - POST: CUSTOMER only (add to wishlist)
 * 
 * Customer Scoping: User sees only their own wishlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        return NextResponse.json(successResponse([]));
      }

      const wishlistItems = await prisma.wishlistItem.findMany({
        where: { customerId: customer.id },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Customer wishlist fetched',
        context: { userId: user.id, count: wishlistItems.length }
      });

      return NextResponse.json(successResponse(wishlistItems));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch wishlist',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { productId } = body;

      if (!productId) {
        throw new ValidationError('Product ID is required');
      }

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      // Check if already in wishlist
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          customerId: customer.id,
          productId
        }
      });

      if (existing) {
        return NextResponse.json(successResponse(existing));
      }

      const wishlistItem = await prisma.wishlistItem.create({
        data: {
          customerId: customer.id,
          productId
        },
        include: { product: true }
      });

      logger.info({
        message: 'Product added to wishlist',
        context: { userId: user.id, productId }
      });

      return NextResponse.json(successResponse(wishlistItem), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to add to wishlist',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

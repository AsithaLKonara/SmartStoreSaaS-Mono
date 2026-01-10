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
import { successResponse, ValidationError, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/wishlist
 * Get customer wishlist (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        return NextResponse.json(successResponse([]));
      }

      // First get the customer's wishlist
      const wishlist = await prisma.wishlists.findFirst({
        where: { customerId: customer.id }
      });

      if (!wishlist) {
        return NextResponse.json(successResponse([]));
      }

      const wishlistItems = await prisma.wishlist_items.findMany({
        where: { wishlistId: wishlist.id },
        include: { products: true },
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Customer wishlist fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          count: wishlistItems.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(wishlistItems));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch wishlist',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch wishlist',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/customer-portal/wishlist
 * Add product to wishlist (authenticated customer)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { productId } = body;

      if (!productId) {
        throw new ValidationError('Product ID is required', {
          fields: { productId: !productId }
        });
      }

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Get or create customer's wishlist
      let wishlist = await prisma.wishlists.findFirst({
        where: { customerId: customer.id }
      });

      if (!wishlist) {
        wishlist = await prisma.wishlists.create({
          data: {
            id: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            customerId: customer.id,
            name: 'My Wishlist',
            updatedAt: new Date()
          }
        });
      }

      // Check if already in wishlist
      const existing = await prisma.wishlist_items.findFirst({
        where: {
          wishlistId: wishlist.id,
          productId
        }
      });

      if (existing) {
        return NextResponse.json(successResponse(existing));
      }

      const wishlistItem = await prisma.wishlist_items.create({
        data: {
          id: `wishlist_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          wishlistId: wishlist.id,
          productId
        },
        include: { products: true }
      });

      logger.info({
        message: 'Product added to wishlist',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          productId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(wishlistItem), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to add to wishlist',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to add to wishlist',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * Wishlist API Route
 * 
 * Authorization:
 * - All methods: Requires authentication
 * - Users can only manage their own wishlist
 * 
 * Customer Scoping: Own wishlist only
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const userId = user.id;

      let wishlist = await prisma.wishlists.findFirst({
        where: { customerId: userId },
        include: {
          wishlist_items: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  stock: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      if (!wishlist) {
        wishlist = await prisma.wishlists.create({
          data: {
            id: `wishlist-${Date.now()}`,
            customerId: userId,
            name: 'My Wishlist',
            isPublic: false,
            updatedAt: new Date()
          },
          include: {
            wishlist_items: {
              include: { products: true }
            }
          }
        });
      }

      logger.info({
        message: 'Wishlist fetched',
        context: { userId: user.id, itemCount: wishlist.wishlist_items.length }
      });

      return NextResponse.json(successResponse({
        wishlistId: wishlist.id,
        name: wishlist.name,
        isPublic: wishlist.isPublic,
        items: wishlist.wishlist_items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.products.name,
          description: item.products.description,
          price: Number(item.products.price),
          stock: item.products.stock,
          sku: item.products.sku,
          quantity: item.quantity
        }))
      }));
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

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { productId, quantity = 1 } = body;

      if (!productId) {
        throw new ValidationError('Product ID is required');
      }

      const userId = user.id;

      let wishlist = await prisma.wishlists.findFirst({
        where: { customerId: userId }
      });

      if (!wishlist) {
        wishlist = await prisma.wishlists.create({
          data: {
            id: `wishlist-${Date.now()}`,
            customerId: userId,
            name: 'My Wishlist',
            isPublic: false
          }
        });
      }

      await prisma.wishlist_items.create({
        data: {
          id: `item-${Date.now()}`,
          wishlistId: wishlist.id,
          productId,
          quantity
        }
      });

      logger.info({
        message: 'Item added to wishlist',
        context: { userId: user.id, productId }
      });

      return NextResponse.json(successResponse({ message: 'Added to wishlist' }));
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

export const DELETE = requireAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const itemId = searchParams.get('itemId');

      if (!itemId) {
        throw new ValidationError('Item ID is required');
      }

      const item = await prisma.wishlist_items.findUnique({
        where: { id: itemId },
        include: { wishlist: true }
      });

      if (!item) {
        throw new ValidationError('Wishlist item not found');
      }

      // Verify wishlist belongs to user
      if (item.wishlist.customerId !== user.id) {
        throw new ValidationError('Cannot modify other users wishlists');
      }

      await prisma.wishlist_items.delete({
        where: { id: itemId }
      });

      logger.info({
        message: 'Item removed from wishlist',
        context: { userId: user.id, itemId }
      });

      return NextResponse.json(successResponse({ message: 'Item removed' }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to remove from wishlist',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

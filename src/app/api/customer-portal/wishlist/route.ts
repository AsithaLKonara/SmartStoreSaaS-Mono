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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for CUSTOMER
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
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
      context: { userId: session.user.id, count: wishlistItems.length }
    });

    return NextResponse.json(successResponse(wishlistItems));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch wishlist',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for CUSTOMER
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
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
      context: { userId: session.user.id, productId }
    });

    return NextResponse.json(successResponse(wishlistItem), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to add to wishlist',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

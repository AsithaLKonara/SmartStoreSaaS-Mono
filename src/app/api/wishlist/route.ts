import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const GET = requireAuth(async (req: AuthenticatedRequest, user) => {
  const wishlist = await prisma.wishlist.findFirst({
    where: { customerId: user.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  logger.info({
    message: 'Wishlist fetched',
    context: {
      userId: user.id,
      itemCount: wishlist?.items.length || 0
    },
    correlation: req.correlationId
  });

  return NextResponse.json(successResponse(wishlist));
});

export const POST = requireAuth(async (req: AuthenticatedRequest, user) => {
  const body = await req.json();
  const { productId } = body;

  if (!productId) {
    return NextResponse.json({
      success: false,
      error: 'Product ID is required'
    }, { status: 400 });
  }

  // Verify product belongs to user's organization (if user has organizationId)
  if (user.organizationId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId: user.organizationId
      }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found or not accessible'
      }, { status: 404 });
    }
  }

  let wishlist = await prisma.wishlist.findFirst({
    where: { customerId: user.id }
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        id: crypto.randomUUID(),
        customerId: user.id,
        organizationId: user.organizationId || 'default', // Wishlist requires organizationId
        updatedAt: new Date()
      }
    });
  }

  const item = await prisma.wishlistItem.create({
    data: {
      id: crypto.randomUUID(),
      wishlistId: wishlist.id,
      productId
    }
  });

  logger.info({
    message: 'Item added to wishlist',
    context: {
      userId: user.id,
      productId,
      wishlistId: wishlist.id
    },
    correlation: req.correlationId
  });

  return NextResponse.json(
    successResponse(item, { message: 'Item added to wishlist' }),
    { status: 201 }
  );
});

export const DELETE = requireAuth(async (req: AuthenticatedRequest, user) => {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({
      success: false,
      error: 'Product ID is required'
    }, { status: 400 });
  }

  const wishlist = await prisma.wishlist.findFirst({
    where: { customerId: user.id }
  });

  if (!wishlist) {
    return NextResponse.json({
      success: false,
      error: 'Wishlist not found'
    }, { status: 404 });
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      wishlistId: wishlist.id,
      productId
    }
  });

  logger.info({
    message: 'Item removed from wishlist',
    context: {
      userId: user.id,
      productId,
      wishlistId: wishlist.id
    },
    correlation: req.correlationId
  });

  return NextResponse.json(successResponse(null, { message: 'Item removed' }));
});

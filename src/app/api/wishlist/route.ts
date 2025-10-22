import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const wishlist = await prisma.wishlists.findFirst({
      where: { customerId: session.user.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: wishlist });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch wishlist', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    let wishlist = await prisma.wishlists.findFirst({
      where: { customerId: session.user.id }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlists.create({
        data: { customerId: session.user.id }
      });
    }

    const item = await prisma.wishlist_items.create({
      data: {
        wishlistId: wishlist.id,
        productId
      }
    });

    logger.info({ message: 'Item added to wishlist', context: { userId: session.user.id, productId } });
    return NextResponse.json({ success: true, data: item, message: 'Item added to wishlist' });
  } catch (error: any) {
    logger.error({ message: 'Failed to add to wishlist', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const wishlist = await prisma.wishlists.findFirst({
      where: { customerId: session.user.id }
    });

    if (!wishlist) {
      return NextResponse.json({ success: false, error: 'Wishlist not found' }, { status: 404 });
    }

    await prisma.wishlist_items.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId
      }
    });

    logger.info({ message: 'Item removed from wishlist', context: { userId: session.user.id, productId } });
    return NextResponse.json({ success: true, message: 'Item removed' });
  } catch (error: any) {
    logger.error({ message: 'Failed to remove from wishlist', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}

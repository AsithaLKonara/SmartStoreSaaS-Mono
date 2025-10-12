/**
 * Wishlist API
 * Manages customer wishlists
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wishlist - Get user's wishlist
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = token.sub as string;

    // Get or create wishlist
    let wishlist = await prisma.wishlists.findFirst({
      where: {
        customerId: userId,
      },
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
                sku: true,
              }
            }
          }
        }
      }
    });

    if (!wishlist) {
      // Create default wishlist
      wishlist = await prisma.wishlists.create({
        data: {
          id: `wishlist-${Date.now()}`,
          customerId: userId,
          name: 'My Wishlist',
          isPublic: false,
          updatedAt: new Date(),
        },
        include: {
          wishlist_items: {
            include: {
              products: true
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
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
          addedAt: item.createdAt,
        })),
        itemCount: wishlist.wishlist_items.length,
      }
    });
  } catch (error: any) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist - Add item to wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = token.sub as string;
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get or create wishlist
    let wishlist = await prisma.wishlists.findFirst({
      where: {
        customerId: userId,
      },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlists.create({
        data: {
          id: `wishlist-${Date.now()}`,
          customerId: userId,
          name: 'My Wishlist',
          isPublic: false,
          updatedAt: new Date(),
        },
      });
    }

    // Check if product already in wishlist
    const existing = await prisma.wishlist_items.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    await prisma.wishlist_items.create({
      data: {
        id: `wishlist-item-${Date.now()}`,
        wishlistId: wishlist.id,
        productId,
        quantity,
      },
    });

    // Update wishlist timestamp
    await prisma.wishlists.update({
      where: { id: wishlist.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Product added to wishlist',
      data: { wishlistId: wishlist.id }
    });
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist - Remove item from wishlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const productId = searchParams.get('productId');

    if (!itemId && !productId) {
      return NextResponse.json(
        { success: false, error: 'Item ID or Product ID is required' },
        { status: 400 }
      );
    }

    if (itemId) {
      // Delete by item ID
      await prisma.wishlist_items.delete({
        where: { id: itemId },
      });
    } else if (productId) {
      // Delete by product ID
      const userId = token.sub as string;
      const wishlist = await prisma.wishlists.findFirst({
        where: { customerId: userId },
      });

      if (wishlist) {
        await prisma.wishlist_items.deleteMany({
          where: {
            wishlistId: wishlist.id,
            productId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (error: any) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/wishlist - Update wishlist settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = token.sub as string;
    const body = await request.json();
    const { name, isPublic } = body;

    const wishlist = await prisma.wishlists.findFirst({
      where: { customerId: userId },
    });

    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    await prisma.wishlists.update({
      where: { id: wishlist.id },
      data: {
        ...(name && { name }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Wishlist updated',
    });
  } catch (error: any) {
    console.error('Update wishlist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}


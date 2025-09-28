import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/wishlist/items - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wishlistId, productId, notes } = await request.json();

    if (!wishlistId || !productId) {
      return NextResponse.json({ error: 'Wishlist ID and product ID required' }, { status: 400 });
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId,
        productId
      }
    });

    if (existingItem) {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 400 });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId,
        notes
      },
      include: {
        product: {
          include: {
            media: true,
            productVariants: true
          }
        }
      }
    });

    return NextResponse.json(wishlistItem);
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/wishlist/items - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    await prisma.wishlistItem.delete({
      where: {
        id: itemId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
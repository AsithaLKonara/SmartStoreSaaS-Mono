import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateShareCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// GET /api/wishlist - Get user's wishlists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const wishlists = await prisma.wishlist.findMany({
      where: {
        customerId,
        organizationId: session.user.organizationId
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: true,
                productVariants: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ wishlists });
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wishlist - Create new wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, customerId, isPublic = false } = await request.json();

    if (!name || !customerId) {
      return NextResponse.json({ error: 'Name and customer ID required' }, { status: 400 });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        name,
        customerId,
        organizationId: session.user.organizationId!,
        isPublic,
        shareCode: isPublic ? generateShareCode() : null
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: true,
                productVariants: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/wishlist - Update wishlist
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, isPublic } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Wishlist ID required' }, { status: 400 });
    }

    const wishlist = await prisma.wishlist.update({
      where: {
        id,
        organizationId: session.user.organizationId!
      },
      data: {
        name,
        isPublic,
        shareCode: isPublic ? generateShareCode() : null
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: true,
                productVariants: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/wishlist - Delete wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Wishlist ID required' }, { status: 400 });
    }

    await prisma.wishlist.delete({
      where: {
        id,
        organizationId: session.user.organizationId!
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
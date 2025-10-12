/**
 * Shopping Cart API
 * Manages shopping cart items for customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart - Get user's shopping cart
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

    // Get or create cart for user (using draft order as cart)
    let cart = await prisma.order.findFirst({
      where: {
        customerId: userId,
        status: 'DRAFT', // Draft orders are carts
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stock: true,
              }
            }
          }
        }
      }
    });

    // Calculate cart totals
    const items = cart?.orderItems || [];
    const subtotal = items.reduce((sum, item) => 
      sum + Number(item.price) * item.quantity, 0
    );
    const shipping = subtotal > 0 ? 500 : 0; // LKR 500 flat shipping
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    return NextResponse.json({
      success: true,
      data: {
        cartId: cart?.id || null,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          description: item.product.description,
          price: Number(item.price),
          quantity: item.quantity,
          subtotal: Number(item.price) * item.quantity,
          stock: item.product.stock,
        })),
        summary: {
          itemCount: items.length,
          subtotal,
          shipping,
          tax,
          total,
        }
      }
    });
  } catch (error: any) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart - Add item to cart
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

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Get or create cart (draft order)
    let cart = await prisma.order.findFirst({
      where: {
        customerId: userId,
        status: 'DRAFT',
      },
      include: {
        orderItems: true
      }
    });

    if (!cart) {
      // Create new cart
      cart = await prisma.order.create({
        data: {
          id: `cart-${Date.now()}`,
          orderNumber: `CART-${Date.now()}`,
          customerId: userId,
          organizationId: product.organizationId,
          status: 'DRAFT',
          total: 0,
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
        },
        include: {
          orderItems: true
        }
      });
    }

    // Check if item already in cart
    const existingItem = cart.orderItems.find(item => item.productId === productId);

    if (existingItem) {
      // Update quantity
      await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          total: Number(product.price) * (existingItem.quantity + quantity),
        },
      });
    } else {
      // Add new item
      await prisma.orderItem.create({
        data: {
          id: `item-${Date.now()}`,
          orderId: cart.id,
          productId,
          quantity,
          price: product.price,
          total: Number(product.price) * quantity,
        },
      });
    }

    // Update cart totals
    const items = await prisma.orderItem.findMany({
      where: { orderId: cart.id },
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
    const shipping = 500; // LKR
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    await prisma.order.update({
      where: { id: cart.id },
      data: { subtotal, tax, shipping, total },
    });

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      data: { cartId: cart.id, itemCount: items.length }
    });
  } catch (error: any) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cart - Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Item ID and quantity are required' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check stock
    if (item.product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Update item
    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        quantity,
        total: Number(item.price) * quantity,
      },
    });

    // Update cart totals
    const cart = await prisma.order.findUnique({
      where: { id: item.orderId },
      include: { orderItems: true },
    });

    if (cart) {
      const subtotal = cart.orderItems.reduce((sum, item) => sum + Number(item.total), 0);
      const shipping = 500;
      const tax = subtotal * 0.1;
      const total = subtotal + shipping + tax;

      await prisma.order.update({
        where: { id: cart.id },
        data: { subtotal, tax, shipping, total },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cart updated',
    });
  } catch (error: any) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cart' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart - Remove item from cart
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

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Update cart totals
    const cart = await prisma.order.findUnique({
      where: { id: item.orderId },
      include: { orderItems: true },
    });

    if (cart) {
      const subtotal = cart.orderItems.reduce((sum, item) => sum + Number(item.total), 0);
      const shipping = subtotal > 0 ? 500 : 0;
      const tax = subtotal * 0.1;
      const total = subtotal + shipping + tax;

      await prisma.order.update({
        where: { id: cart.id },
        data: { subtotal, tax, shipping, total },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error: any) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}


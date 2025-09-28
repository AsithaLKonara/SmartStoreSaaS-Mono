import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// In-memory cart storage (in production, use Redis or database)
const carts = new Map<string, any>();

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;
    const cartId = user.id; // Use user ID as cart ID

    switch (request.method) {
      case 'GET':
        // Get cart contents
        const cart = carts.get(cartId) || { items: [], total: 0, itemCount: 0 };
        
        // Enrich cart items with product details
        const enrichedItems = await Promise.all(
          cart.items.map(async (item: any) => {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });

            const variant = item.variantId ? await prisma.productVariant.findUnique({
              where: { id: item.variantId },
            }) : null;

            return {
              ...item,
              product,
              variant,
            };
          })
        );

        return NextResponse.json({
          cart: {
            ...cart,
            items: enrichedItems,
          },
        });

      case 'POST':
        // Add item to cart
        const { productId, variantId, quantity } = await request.json();

        if (!productId || !quantity || quantity <= 0) {
          return NextResponse.json(
            { error: 'Missing required fields: productId, quantity' },
            { status: 400 }
          );
        }

        // Verify product exists and is active
        const product = await prisma.product.findFirst({
          where: {
            id: productId,
            organizationId: user.organizationId,
            isActive: true,
          },
          include: {
            variants: variantId ? {
              where: { id: variantId, isActive: true },
            } : false,
          },
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found or inactive' },
            { status: 404 }
          );
        }

        // Check stock availability
        const availableStock = variantId 
          ? product.variants[0]?.stock || 0
          : product.stock;

        if (availableStock < quantity) {
          return NextResponse.json(
            { error: 'Insufficient stock available' },
            { status: 400 }
          );
        }

        // Get or create cart
        let userCart = carts.get(cartId) || { items: [], total: 0, itemCount: 0 };

        // Check if item already exists in cart
        const existingItemIndex = userCart.items.findIndex(
          (item: any) => item.productId === productId && item.variantId === variantId
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          userCart.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item to cart
          const price = variantId ? product.variants[0].price : product.price;
          userCart.items.push({
            productId,
            variantId: variantId || null,
            quantity,
            price: parseFloat(price.toString()),
            addedAt: new Date().toISOString(),
          });
        }

        // Recalculate totals
        userCart.total = userCart.items.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        );
        userCart.itemCount = userCart.items.reduce((sum: number, item: any) => 
          sum + item.quantity, 0
        );

        // Save cart
        carts.set(cartId, userCart);

        return NextResponse.json({
          message: 'Item added to cart successfully',
          cart: userCart,
        });

      case 'PUT':
        // Update item quantity in cart
        const { itemId, quantity: newQuantity } = await request.json();

        if (!itemId || newQuantity === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: itemId, quantity' },
            { status: 400 }
          );
        }

        let cartToUpdate = carts.get(cartId);
        if (!cartToUpdate) {
          return NextResponse.json(
            { error: 'Cart not found' },
            { status: 404 }
          );
        }

        const itemIndex = cartToUpdate.items.findIndex((item: any) => item.id === itemId);
        if (itemIndex === -1) {
          return NextResponse.json(
            { error: 'Item not found in cart' },
            { status: 404 }
          );
        }

        if (newQuantity <= 0) {
          // Remove item from cart
          cartToUpdate.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          cartToUpdate.items[itemIndex].quantity = newQuantity;
        }

        // Recalculate totals
        cartToUpdate.total = cartToUpdate.items.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        );
        cartToUpdate.itemCount = cartToUpdate.items.reduce((sum: number, item: any) => 
          sum + item.quantity, 0
        );

        carts.set(cartId, cartToUpdate);

        return NextResponse.json({
          message: 'Cart updated successfully',
          cart: cartToUpdate,
        });

      case 'DELETE':
        // Clear cart
        carts.delete(cartId);

        return NextResponse.json({
          message: 'Cart cleared successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Cart API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

export const PUT = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

export const DELETE = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

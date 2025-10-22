/**
 * Shopping Cart API Route
 * 
 * Authorization:
 * - All methods: Requires authentication
 * - Customers can only manage their own cart
 * 
 * Cart Implementation:
 * - Uses draft orders as carts
 * - One cart per customer
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

      // Get or find cart (draft order)
      let cart = await prisma.order.findFirst({
        where: {
          customerId: userId,
          status: 'DRAFT'
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
                  stock: true
                }
              }
            }
          }
        }
      });

      const items = cart?.orderItems || [];
      const subtotal = items.reduce((sum, item) => 
        sum + Number(item.price) * item.quantity, 0
      );
      const shipping = subtotal > 0 ? 500 : 0;
      const tax = subtotal * 0.1;
      const total = subtotal + shipping + tax;

      logger.info({
        message: 'Cart fetched',
        context: { userId: user.id, itemCount: items.length }
      });

      return NextResponse.json(successResponse({
        cartId: cart?.id || null,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          description: item.product.description,
          price: Number(item.price),
          quantity: item.quantity,
          subtotal: Number(item.price) * item.quantity,
          stock: item.product.stock
        })),
        summary: {
          itemCount: items.length,
          subtotal,
          shipping,
          tax,
          total
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch cart',
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

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ValidationError('Product not found');
      }

      if (product.stock < quantity) {
        throw new ValidationError('Insufficient stock');
      }

      const userId = user.id;

      // Get or create cart
      let cart = await prisma.order.findFirst({
        where: {
          customerId: userId,
          status: 'DRAFT'
        },
        include: { orderItems: true }
      });

      if (!cart) {
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
            discount: 0
          },
          include: { orderItems: true }
        });
      }

      const existingItem = cart.orderItems.find(item => item.productId === productId);

      if (existingItem) {
        await prisma.orderItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + quantity,
            total: Number(product.price) * (existingItem.quantity + quantity)
          }
        });
      } else {
        await prisma.orderItem.create({
          data: {
            id: `item-${Date.now()}`,
            orderId: cart.id,
            productId,
            quantity,
            price: product.price,
            total: Number(product.price) * quantity
          }
        });
      }

      const items = await prisma.orderItem.findMany({
        where: { orderId: cart.id }
      });

      const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
      const shipping = 500;
      const tax = subtotal * 0.1;
      const total = subtotal + shipping + tax;

      await prisma.order.update({
        where: { id: cart.id },
        data: { subtotal, tax, shipping, total }
      });

      logger.info({
        message: 'Item added to cart',
        context: { userId: user.id, productId, quantity }
      });

      return NextResponse.json(successResponse({ 
        cartId: cart.id, 
        itemCount: items.length 
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to add to cart',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { itemId, quantity } = body;

      if (!itemId || quantity === undefined || quantity < 1) {
        throw new ValidationError('Valid item ID and quantity required');
      }

      const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
        include: { product: true, order: true }
      });

      if (!item) {
        throw new ValidationError('Cart item not found');
      }

      // Verify cart belongs to user
      if (item.order.customerId !== user.id) {
        throw new ValidationError('Cannot modify other users carts');
      }

      if (item.product.stock < quantity) {
        throw new ValidationError('Insufficient stock');
      }

      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          quantity,
          total: Number(item.price) * quantity
        }
      });

      const cart = await prisma.order.findUnique({
        where: { id: item.orderId },
        include: { orderItems: true }
      });

      if (cart) {
        const subtotal = cart.orderItems.reduce((sum, i) => sum + Number(i.total), 0);
        await prisma.order.update({
          where: { id: cart.id },
          data: {
            subtotal,
            tax: subtotal * 0.1,
            shipping: 500,
            total: subtotal + (subtotal * 0.1) + 500
          }
        });
      }

      logger.info({
        message: 'Cart updated',
        context: { userId: user.id, itemId, quantity }
      });

      return NextResponse.json(successResponse({ message: 'Cart updated' }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update cart',
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

      const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
        include: { order: true }
      });

      if (!item) {
        throw new ValidationError('Cart item not found');
      }

      // Verify cart belongs to user
      if (item.order.customerId !== user.id) {
        throw new ValidationError('Cannot modify other users carts');
      }

      await prisma.orderItem.delete({
        where: { id: itemId }
      });

      const cart = await prisma.order.findUnique({
        where: { id: item.orderId },
        include: { orderItems: true }
      });

      if (cart) {
        const subtotal = cart.orderItems.reduce((sum, i) => sum + Number(i.total), 0);
        const shipping = subtotal > 0 ? 500 : 0;
        await prisma.order.update({
          where: { id: cart.id },
          data: {
            subtotal,
            tax: subtotal * 0.1,
            shipping,
            total: subtotal + (subtotal * 0.1) + shipping
          }
        });
      }

      logger.info({
        message: 'Item removed from cart',
        context: { userId: user.id, itemId }
      });

      return NextResponse.json(successResponse({ message: 'Item removed' }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to remove from cart',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

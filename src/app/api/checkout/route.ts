/**
 * Checkout API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * - Converts cart (draft order) to actual order
 * - Initiates payment processing
 * 
 * Customer Scoping: Own cart only
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  paymentMethod: 'stripe' | 'payhere' | 'cash';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerNotes?: string;
}

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body: CheckoutRequest = await request.json();

      if (!body.paymentMethod || !body.shippingAddress) {
        throw new ValidationError('Payment method and shipping address are required');
      }

      const userId = user.id;

      // CRITICAL: Get cart for this user only
      const cart = await prisma.order.findFirst({
        where: {
          customerId: userId,
          status: 'DRAFT'
        },
        include: {
          orderItems: {
            include: { product: true }
          },
          customer: true
        }
      });

      if (!cart || cart.orderItems.length === 0) {
        throw new ValidationError('Cart is empty');
      }

      // Verify stock availability
      for (const item of cart.orderItems) {
        if (item.product.stock < item.quantity) {
          throw new ValidationError(`Insufficient stock for ${item.product.name}`);
        }
      }

      // Convert cart to order
      const orderNumber = `ORD-${Date.now()}`;
      
      const order = await prisma.order.update({
        where: { id: cart.id },
        data: {
          orderNumber,
          status: 'PENDING',
          notes: body.customerNotes
        }
      });

      // TODO: Initiate payment based on paymentMethod
      // For now, just return the order

      // Update product stock
      for (const item of cart.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      logger.info({
        message: 'Checkout completed',
        context: {
          userId: user.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: Number(order.total),
          paymentMethod: body.paymentMethod
        }
      });

      return NextResponse.json(successResponse({
        order,
        message: 'Order created successfully',
        nextStep: 'payment'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Checkout failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

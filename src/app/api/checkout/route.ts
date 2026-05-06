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
import { requireAuth } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const CheckoutSchema = z.object({
  paymentMethod: z.enum(['stripe', 'payhere', 'paypal', 'cash']),
  shippingAddress: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
  customerNotes: z.string().optional(),
});


interface CheckoutRequest {
  paymentMethod: 'stripe' | 'payhere' | 'paypal' | 'cash';
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
      // Apply rate limiting (abuse/brute-force defense)
      const rateLimitResult = await applyRateLimit(request, 'auth');
      if (rateLimitResult) {
        return rateLimitResult;
      }

      // Lazy-load services to ensure environment variables are available at runtime
      const { stripeService } = await import('@/lib/payments/stripeService');
      const { payHereService } = await import('@/lib/payments/payhereService');
      const { paypalService } = await import('@/lib/payments/paypalService');

      const jsonBody = await request.json();
      const bodyParsed = CheckoutSchema.safeParse(jsonBody);

      if (!bodyParsed.success) {
        throw new ValidationError('Invalid checkout data: ' + bodyParsed.error.errors.map(e => e.message).join(', '));
      }
      
      const body = bodyParsed.data;

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

      // Initiate payment based on paymentMethod
      let paymentData = {};
      let stripePaymentIntentId: string | undefined;

      if (body.paymentMethod === 'stripe') {
        const paymentIntent = await stripeService.createPaymentIntent(
          Number(cart.total),
          'usd',
          undefined,
          { orderId: cart.id, organizationId: cart.organizationId }
        );
        paymentData = { clientSecret: paymentIntent.clientSecret };
        stripePaymentIntentId = paymentIntent.id;
      }
      else if (body.paymentMethod === 'payhere') {
        const params = await payHereService.createPaymentRequest({
          orderId: cart.id,
          amount: Number(cart.total),
          currency: 'LKR',
          firstName: user.name || 'Customer',
          lastName: '',
          email: user.email || 'customer@example.com',
          phone: '+94000000000',
          address: body.shippingAddress.street,
          city: body.shippingAddress.city,
          country: body.shippingAddress.country
        }, cart.organizationId);
        paymentData = { paymentParams: params };
      }
      else if (body.paymentMethod === 'paypal') {
        const paypalOrder = await paypalService.createOrder(
          Number(cart.total),
          'USD',
          cart.id,
          `${process.env.NEXTAUTH_URL}/checkout/success?orderId=${cart.id}`,
          `${process.env.NEXTAUTH_URL}/checkout/cancel?orderId=${cart.id}`
        );
        const approvalLink = paypalOrder.links.find((link: any) => link.rel === 'approve')?.href;
        paymentData = { approvalUrl: approvalLink };
      }

      // Convert cart to order and update product stock in a transaction
      const orderNumber = `ORD-${Date.now()}`;
      const order = await prisma.$transaction(async (tx) => {
        // Update product stock atomically to prevent concurrent overselling race conditions
        for (const item of cart.orderItems) {
          const updateResult = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          
          if (updateResult.count === 0) {
             throw new ValidationError(`Insufficient stock for product: ${item.product.name}`);
          }
        }
        
        // Update the order
        return await tx.order.update({
          where: { id: cart.id },
          data: {
            orderNumber,
            status: 'PENDING',
            notes: body.customerNotes,
            stripePaymentIntentId
          }
        });
      });

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
        paymentData,
        nextStep: body.paymentMethod === 'cash' ? 'confirmation' : 'payment'
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

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
// Services will be lazy-loaded in the handler to prevent build-time errors
// import { stripeService } from '@/lib/payments/stripeService';
// import { payHereService } from '@/lib/payments/payhereService';
// import { paypalService } from '@/lib/payments/paypalService';

export const dynamic = 'force-dynamic';

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
      // Lazy-load services to ensure environment variables are available at runtime
      const { stripeService } = await import('@/lib/payments/stripeService');
      const { payHereService } = await import('@/lib/payments/payhereService');
      const { paypalService } = await import('@/lib/payments/paypalService');

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

      // Initiate payment based on paymentMethod
      let paymentData = {};

      if (body.paymentMethod === 'stripe') {
        const paymentIntent = await stripeService.createPaymentIntent(
          Number(order.total),
          'usd', // Default to USD for Stripe or fetch from organization settings
          undefined, // Customer ID if available
          { orderId: order.id, organizationId: order.organizationId }
        );
        paymentData = { clientSecret: paymentIntent.clientSecret };
      }
      else if (body.paymentMethod === 'payhere') {
        const params = await payHereService.createPaymentRequest({
          orderId: order.id,
          amount: Number(order.total),
          currency: 'LKR', // PayHere usually requires LKR
          firstName: 'Customer', // Extract from user profile if available
          lastName: '',
          email: user.email || 'customer@example.com',
          phone: '+94000000000',
          address: body.shippingAddress.street,
          city: body.shippingAddress.city,
          country: body.shippingAddress.country
        }, order.organizationId);
        paymentData = { paymentParams: params };
      }
      else if (body.paymentMethod === 'paypal') {
        const paypalOrder = await paypalService.createOrder(
          Number(order.total),
          'USD',
          order.id,
          `${process.env.NEXTAUTH_URL}/checkout/success?orderId=${order.id}`,
          `${process.env.NEXTAUTH_URL}/checkout/cancel?orderId=${order.id}`
        );
        const approvalLink = paypalOrder.links.find(link => link.rel === 'approve')?.href;
        paymentData = { approvalUrl: approvalLink };
      }

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

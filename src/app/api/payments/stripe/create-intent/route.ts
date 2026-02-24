/**
 * Stripe Payment Intent Creation Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * - Creates Stripe payment intent
 * 
 * Customer Scoping: Validated through order
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { stripeService } from '@/lib/payments/stripeService';
import { AuditService } from '@/lib/audit';


export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId, amount, currency = 'usd', metadata = {} } = body;

      if (!orderId || !amount) {
        throw new ValidationError('Order ID and amount are required');
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new ValidationError('Order not found');
      }

      // Verify ownership
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (!customer || order.customerId !== customer.id) {
          throw new ValidationError('Unauthorized - Order does not belong to user');
        }
      } else if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Unauthorized - Organization mismatch');
      }

      logger.info({
        message: 'Stripe payment intent requested',
        context: { userId: user.id, orderId, amount }
      });

      // Create actual Stripe intent
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency,
        undefined, // We can pass Stripe Customer ID here if we have it
        {
          orderId,
          userId: user.id,
          organizationId: user.organizationId,
          ...metadata
        }
      );

      // Update order with payment intent ID
      await prisma.order.update({
        where: { id: orderId },
        data: {
          stripePaymentIntentId: paymentIntent.id
        }
      });

      // Audit log the action
      await AuditService.log({
        userId: user.id,
        organizationId: (user.organizationId || order.organizationId) as string,
        action: 'CREATE_PAYMENT_INTENT',
        resource: 'PAYMENT',
        resourceId: paymentIntent.id,
        details: { orderId, amount, status: paymentIntent.status }
      });

      return NextResponse.json(successResponse({
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      }));

    } catch (error: any) {
      logger.error({
        message: 'Stripe intent creation failed',
        error: error instanceof Error ? error.message : String(error),
        context: { userId: user.id, orderId: (await request.json().catch(() => ({}))).orderId }
      });

      return NextResponse.json({
        success: false,
        error: error.message || 'Payment intent creation failed'
      }, { status: error instanceof ValidationError ? 400 : 500 });
    }
  }
);


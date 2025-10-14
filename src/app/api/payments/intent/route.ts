/**
 * Payment Intent API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * - Creates payment intent for user's order
 * 
 * Customer Scoping: Validated through order ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId, amount, currency = 'usd' } = body;

      if (!orderId || !amount) {
        throw new ValidationError('Order ID and amount are required');
      }

      // Verify order belongs to user or user's organization
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
          throw new ValidationError('Cannot create payment for other customers orders');
        }
      } else {
        // Admin/Staff must be in same organization
        if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
          throw new ValidationError('Cannot create payment for orders in other organizations');
        }
      }

      logger.info({
        message: 'Payment intent created',
        context: {
          userId: user.id,
          orderId,
          amount,
          currency
        }
      });

      // TODO: Create actual Stripe payment intent
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        amount,
        currency,
        status: 'pending',
        clientSecret: 'mock_secret_key'
      };

      return NextResponse.json(successResponse(paymentIntent));
    } catch (error: any) {
      logger.error({
        message: 'Failed to create payment intent',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

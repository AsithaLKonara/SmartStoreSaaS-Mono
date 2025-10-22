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

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId, amount, currency = 'usd' } = body;

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
          throw new ValidationError('Unauthorized');
        }
      } else if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Unauthorized');
      }

      logger.info({
        message: 'Stripe payment intent requested',
        context: { userId: user.id, orderId, amount }
      });

      // TODO: Create actual Stripe intent
      return NextResponse.json(successResponse({
        clientSecret: 'mock_secret',
        status: 'pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Stripe intent creation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

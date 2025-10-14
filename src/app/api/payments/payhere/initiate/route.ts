/**
 * PayHere Payment Initiation Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * - Initiates PayHere payment for LKR transactions
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
      const { orderId } = body;

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
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
        message: 'PayHere payment initiated',
        context: {
          userId: user.id,
          orderId,
          amount: Number(order.total)
        }
      });

      // TODO: Create actual PayHere payment
      return NextResponse.json(successResponse({
        paymentUrl: '/payment/payhere',
        orderId,
        amount: Number(order.total)
      }));
    } catch (error: any) {
      logger.error({
        message: 'PayHere initiation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

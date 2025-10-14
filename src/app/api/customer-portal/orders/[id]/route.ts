/**
 * Customer Portal Single Order API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (view own order details)
 * 
 * Customer Scoping: User sees only their own orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('CUSTOMER')(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const orderId = params.id;

      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          delivery: true
        }
      });

      if (!order) {
        throw new ValidationError('Order not found');
      }

      // Verify ownership
      if (order.customerId !== customer.id) {
        throw new ValidationError('Cannot view other customers orders');
      }

      logger.info({
        message: 'Customer order details fetched',
        context: { userId: user.id, orderId }
      });

      return NextResponse.json(successResponse(order));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer order',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

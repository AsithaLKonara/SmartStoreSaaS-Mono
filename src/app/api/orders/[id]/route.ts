/**
 * Single Order API Route
 * 
 * Authorization:
 * - GET: Authenticated (customers see own, staff see org orders)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_ORDERS permission)
 * 
 * Organization/Customer Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const orderId = params.id;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true, items: true }
      });

      if (!order) {
        throw new ValidationError('Order not found');
      }

      // Verify access
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        if (!customer || order.customerId !== customer.id) {
          throw new ValidationError('Cannot view other customers orders');
        }
      } else if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view orders from other organizations');
      }

      logger.info({
        message: 'Order fetched',
        context: { userId: user.id, orderId }
      });

      return NextResponse.json(successResponse(order));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch order',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const orderId = params.id;
      const body = await request.json();

      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new ValidationError('Order not found');
      }

      if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update orders from other organizations');
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: body
      });

      logger.info({
        message: 'Order updated',
        context: { userId: user.id, orderId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update order',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

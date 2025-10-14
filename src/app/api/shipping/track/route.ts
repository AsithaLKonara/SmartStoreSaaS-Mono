/**
 * Shipping Tracking API Route
 * 
 * Authorization:
 * - GET: Requires authentication (customers can track own shipments)
 * 
 * Customer Scoping: Validated through order ownership
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
      const { searchParams } = new URL(request.url);
      const trackingNumber = searchParams.get('trackingNumber');
      const orderId = searchParams.get('orderId');

      if (!trackingNumber && !orderId) {
        throw new ValidationError('Tracking number or order ID is required');
      }

      if (orderId) {
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
            throw new ValidationError('Cannot track other customers orders');
          }
        } else if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
          throw new ValidationError('Cannot track orders from other organizations');
        }
      }

      logger.info({
        message: 'Tracking requested',
        context: { userId: user.id, trackingNumber, orderId }
      });

      // TODO: Fetch actual tracking info
      return NextResponse.json(successResponse({
        trackingNumber,
        status: 'in_transit',
        events: [],
        message: 'Tracking - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Tracking fetch failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, AuthenticatedRequest, validateOrganizationAccess } from '@/lib/rbac/middleware';
import { successResponse, NotFoundError, ValidationError } from '@/lib/middleware/withErrorHandler';
import { OrderStateService } from '@/lib/services/order-state.service';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const FulfillRequestSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrier: z.string().min(1, 'Carrier is required')
});

/**
 * PATCH /api/orders/[id]/fulfill
 * Fulfill an order: Assign carrier and tracking number, mark as SHIPPED.
 */
export const PATCH = requirePermission(Permission.SHIPPING_MANAGE)(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const orderId = params.id;
      const jsonBody = await req.json();

      const parsed = FulfillRequestSchema.safeParse(jsonBody);
      if (!parsed.success) {
        throw new ValidationError('Invalid fulfillment data: ' + parsed.error.errors.map(e => e.message).join(', '));
      }

      const { trackingNumber, carrier } = parsed.data;

      const order = await prisma.order.findUnique({
        where: { id: orderId, organizationId: user.organizationId }
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // 1. Enforce backend check: Order must be PAID (i.e. status === PROCESSING) to fulfill
      if (order.status !== OrderStatus.PROCESSING) {
        throw new ValidationError('Order must be PAID before it can be fulfilled');
      }

      // 2. Validate Order State Transition from PROCESSING to SHIPPED (FULFILLED)
      OrderStateService.validateTransition(order.status, OrderStatus.SHIPPED);

      // 3. Process inside a transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Update Order details
        const o = await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.SHIPPED,
            trackingNumber,
            carrier,
            shippedAt: new Date()
          }
        });

        // Add to OrderStatusHistory
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.SHIPPED,
            notes: `Order fulfilled. Carrier: ${carrier}, Tracking #: ${trackingNumber}`
          }
        });

        return o;
      });

      logger.info({
        message: 'Order successfully fulfilled',
        context: { orderId, trackingNumber, carrier, userId: user.id }
      });

      return NextResponse.json(successResponse({
        message: 'Order fulfilled successfully',
        order: updatedOrder
      }));
    } catch (error: any) {
      logger.error({
        message: 'Fulfillment failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { orderId: params.id, userId: user.id }
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: error.message || 'Fulfillment failed due to an internal error',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

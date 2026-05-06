/**
 * Single Order API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_ORDERS permission), CUSTOMER (their own orders)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_ORDERS permission)
 * - DELETE: SUPER_ADMIN (MANAGE_ORDERS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, AuthorizationError, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const OrderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional()
});

/**
 * GET /api/orders/[id]
 * Get single order with organization scoping
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const orderId = resolvedParams.id;
  
  const handler = requirePermission(Permission.ORDER_READ)(
    async (req: AuthenticatedRequest, user) => {
      try {

        // Get order with related data
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            },
            deliveries: true,
            payments: true
          }
        });

        if (!order) {
          throw new NotFoundError('Order not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, order.organizationId)) {
          throw new AuthorizationError('Cannot view orders from other organizations');
        }

        // CUSTOMER can only view their own orders
        if (user.role === 'CUSTOMER') {
          const customer = await prisma.customer.findFirst({
            where: { email: user.email, organizationId: order.organizationId }
          });
          
          if (!customer || order.customerId !== customer.id) {
            throw new AuthorizationError('Cannot view other customers\' orders');
          }
        }

        logger.info({
          message: 'Order fetched successfully',
          context: {
            userId: user.id,
            orderId,
            organizationId: order.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(order));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch order',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            orderId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch order',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * PUT /api/orders/[id]
 * Update order
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const orderId = resolvedParams.id;
  
  const handler = requirePermission(Permission.ORDER_UPDATE)(
    async (req: AuthenticatedRequest, user) => {
      try {
        const jsonBody = await req.json();
        const parsed = OrderUpdateSchema.safeParse(jsonBody);
        
        if (!parsed.success) {
          throw new ValidationError('Invalid update data: ' + parsed.error.errors.map(e => e.message).join(', '));
        }

        const { status, notes, trackingNumber } = parsed.data;

        // Fetch order to validate access
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        });

        if (!order) {
          throw new NotFoundError('Order not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, order.organizationId)) {
          throw new AuthorizationError('Cannot update orders from other organizations');
        }

        // Process Refund and Restock if status is changing to REFUNDED or CANCELLED
        const isRestocking = (status === 'REFUNDED' || status === 'CANCELLED') && order.status !== status;
        
        let updatedOrder;
        
        if (isRestocking) {
            // Include order items to restore stock
            const orderWithItems = await prisma.order.findUnique({
              where: { id: orderId },
              include: { orderItems: true }
            });
            
            updatedOrder = await prisma.$transaction(async (tx) => {
               for (const item of orderWithItems!.orderItems) {
                 await tx.product.update({
                   where: { id: item.productId },
                   data: { stock: { increment: item.quantity } }
                 });
               }
               
               return await tx.order.update({
                  where: { id: orderId },
                  data: {
                    ...(status && { status }),
                    ...(notes && { notes }),
                    ...(trackingNumber && { trackingNumber }),
                    updatedAt: new Date()
                  },
                  include: {
                    orderItems: { include: { product: true } }
                  }
               });
            });
        } else {
            updatedOrder = await prisma.order.update({
              where: { id: orderId },
              data: {
                ...(status && { status }),
                ...(notes && { notes }),
                ...(trackingNumber && { trackingNumber }),
                updatedAt: new Date()
              },
              include: {
                orderItems: {
                  include: {
                    product: true
                  }
                }
              }
            });
        }

        logger.info({
          message: 'Order updated successfully',
          context: {
            userId: user.id,
            orderId,
            status,
            trackingNumber,
            organizationId: order.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(updatedOrder));
      } catch (error: any) {
        logger.error({
          message: 'Failed to update order',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            orderId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to update order',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * DELETE /api/orders/[id]
 * Delete order (SUPER_ADMIN only)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const orderId = resolvedParams.id;
  
  const handler = requirePermission(Permission.ORDER_UPDATE)(
    async (req: AuthenticatedRequest, user) => {
      try {
        // Only SUPER_ADMIN can delete orders
        if (user.role !== 'SUPER_ADMIN') {
          throw new AuthorizationError('Only SUPER_ADMIN can delete orders');
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        });

        if (!order) {
          throw new NotFoundError('Order not found');
        }

        // Validate organization access (even SUPER_ADMIN should validate)
        if (!validateOrganizationAccess(user, order.organizationId)) {
          throw new AuthorizationError('Cannot delete orders from other organizations');
        }

        // Delete order (this will cascade delete order items)
        await prisma.order.delete({
          where: { id: orderId }
        });

        logger.info({
          message: 'Order deleted successfully',
          context: {
            userId: user.id,
            orderId,
            organizationId: order.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({ message: 'Order deleted successfully' }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to delete order',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            orderId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to delete order',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}
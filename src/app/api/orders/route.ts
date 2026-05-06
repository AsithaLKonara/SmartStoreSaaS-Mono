/**
 * Orders API Route
 * 
 * Handles order management operations
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_ORDERS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (CREATE_ORDERS permission)
 * 
 * Organization Scoping:
 * - All users see only their organization's orders
 * - CUSTOMER sees only their own orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { OrderService } from '@/lib/services/order.service';
import { ValidationError } from '@/lib/middleware/withErrorHandler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const OrderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional().transform(val => val || undefined),
});

const OrderCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().optional().default(0),
  shipping: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative(),
  notes: z.string().optional(),
});

/**
 * GET /api/orders
 * List orders with organization and customer scoping
 */
export const GET = requirePermission(Permission.ORDER_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      
      const queryResult = OrderQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        status: searchParams.get('status'),
      });

      if (!queryResult.success) {
        throw new ValidationError('Invalid query parameters: ' + queryResult.error.errors.map(e => e.message).join(', '));
      }

      const { page, limit, status } = queryResult.data;
      const orgId = getOrganizationScope(user);

      if (!orgId) {
        return NextResponse.json({
          success: false,
          message: 'Organization ID required'
        }, { status: 400 });
      }

      let customerId: string | undefined = undefined;

      // Add customer scoping for CUSTOMER role
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email, organizationId: orgId }
        });

        if (customer) {
          customerId = customer.id;
        } else {
          return NextResponse.json(
            successResponse([], { total: 0, page, limit, totalPages: 0 })
          );
        }
      }

      const result = await OrderService.getOrders({
        organizationId: orgId,
        page,
        limit,
        status: status as any,
        customerId
      });

      logger.info({
        message: 'Orders fetched via Service',
        context: {
          count: result.orders.length,
          page,
          limit,
          organizationId: orgId,
          userRole: user.role
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(result.orders, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch orders',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch orders',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/orders
 * Create new order
 */
export const POST = requirePermission(Permission.ORDER_CREATE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const jsonBody = await req.json();
      const bodyResult = OrderCreateSchema.safeParse(jsonBody);

      if (!bodyResult.success) {
        throw new ValidationError('Invalid order data: ' + bodyResult.error.errors.map(e => e.message).join(', '));
      }

      const { customerId, items, subtotal, tax, shipping, discount, total, notes } = bodyResult.data;

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        return NextResponse.json({
          success: false,
          message: 'User must belong to an organization'
        }, { status: 400 });
      }

      // Security Check: If user is a CUSTOMER, they can only create orders for themselves
      let effectiveCustomerId = customerId;
      if (user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findFirst({
          where: { email: user.email, organizationId }
        });

        if (!customer) {
          return NextResponse.json({
            success: false,
            message: 'Customer record not found for your account'
          }, { status: 403 });
        }

        if (customerId && customerId !== customer.id) {
          logger.warn({
            message: 'Unauthorized order attempt',
            context: { userId: user.id, requestedCustomerId: customerId, actualCustomerId: customer.id }
          });
          return NextResponse.json({
            success: false,
            message: 'You can only create orders for your own account'
          }, { status: 403 });
        }

        effectiveCustomerId = customer.id;
      }

      // Business logic delegated to service
      const order = await OrderService.createOrder({
        customerId: effectiveCustomerId,
        organizationId,
        items,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        notes,
        createdById: user.id
      });


      logger.info({
        message: 'Order created via Service',
        context: {
          orderId: order?.id,
          orderNumber: order?.orderNumber,
          customerId,
          organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(order),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create order',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create order',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);

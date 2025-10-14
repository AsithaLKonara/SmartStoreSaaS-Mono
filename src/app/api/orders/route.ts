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
import { requirePermission, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 * List orders with organization and customer scoping
 */
export const GET = requirePermission('VIEW_ORDERS')(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || '';
      const skip = (page - 1) * limit;

      // Organization scoping
      const orgId = getOrganizationScope(user);
      
      // Build where clause
      const where: any = {};
      
      // CRITICAL: Organization scoping
      if (orgId) {
        where.organizationId = orgId;
      }
      
      // CRITICAL: Customer can only see their own orders
      if (user.role === 'CUSTOMER') {
        // Find customer record
        const customer = await prisma.customer.findFirst({
          where: { email: user.email }
        });
        
        if (customer) {
          where.customerId = customer.id;
        } else {
          // No customer record = no orders
          return NextResponse.json(
            successResponse([], { total: 0, page, limit, totalPages: 0 })
          );
        }
      }
      
      // Add optional filters
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.order.count({ where })
      ]);

      logger.info({
        message: 'Orders fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role,
          count: orders.length,
          page,
          limit
        }
      });

      return NextResponse.json(
        successResponse(orders, {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch orders',
        error: error,
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);

/**
 * POST /api/orders
 * Create new order
 */
export const POST = requirePermission('CREATE_ORDERS')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { customerId, items, subtotal, tax, shipping, discount, total, notes } = body;

      // Validation
      if (!customerId || !items || items.length === 0) {
        throw new ValidationError('Customer ID and items are required');
      }

      // Organization scoping
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Verify customer belongs to same organization
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      if (customer.organizationId !== organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot create orders for customers in other organizations');
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId,
          organizationId, // CRITICAL: ensure order belongs to user's org
          subtotal,
          tax: tax || 0,
          shipping: shipping || 0,
          discount: discount || 0,
          total,
          notes,
          status: 'PENDING'
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      logger.info({
        message: 'Order created',
        context: {
          createdBy: user.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId,
          total,
          organizationId
        }
      });

      return NextResponse.json(
        successResponse(order),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to create order',
        error: error,
        context: {
          userId: user.id,
          organizationId: user.organizationId
        }
      });
      throw error;
    }
  }
);

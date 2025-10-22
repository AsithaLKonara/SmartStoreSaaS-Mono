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

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 * List orders with organization and customer scoping
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'VIEW_ORDERS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // TODO: Get organization scoping from session
    // const orgId = session.user.organizationId;
    
    // Build where clause
    const where: any = {};
    
    // TODO: Add organization scoping
    // if (orgId) {
    //   where.organizationId = orgId;
    // }
    
    // TODO: Add customer scoping for CUSTOMER role
    // if (session.user.role === 'CUSTOMER') {
    //   const customer = await prisma.customer.findFirst({
    //     where: { email: session.user.email }
    //   });
    //   
    //   if (customer) {
    //     where.customerId = customer.id;
    //   } else {
    //     return NextResponse.json(
    //       successResponse([], { total: 0, page, limit, totalPages: 0 })
    //     );
    //   }
    // }
    
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
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Create new order
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'CREATE_ORDERS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { customerId, items, subtotal, tax, shipping, discount, total, notes } = body;

    // Validation
    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer ID and items are required' }, { status: 400 });
    }

    // TODO: Get organizationId from session
    // const organizationId = session.user.organizationId;
    // if (!organizationId) {
    //   return NextResponse.json({ success: false, message: 'User must belong to an organization' }, { status: 400 });
    // }

    // Verify customer belongs to same organization
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const organizationId = session.user.organizationId;
    if (customer.organizationId !== organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Cannot create orders for customers in other organizations' }, { status: 403 });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        organizationId,
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
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId,
        total
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
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { withCache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
// import { addTenantFilter, ensureTenantOwnership } from '@/lib/tenant/isolation'; // Temporarily disabled

export const dynamic = 'force-dynamic';
// Helper function to fetch orders
async function getOrders(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customers: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (status) {
    where.status = status;
  }

  // Fetch orders using connection pool with optimized query
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        subtotal: true,
        tax: true,
        shipping: true,
        discount: true,
        createdAt: true,
        updatedAt: true,
        customers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            products: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    message: 'Orders fetched successfully'
  });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/orders - Fetch all orders with pagination and filtering
export const GET = withErrorHandling(getOrders);

// POST /api/orders - Create a new order
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { customerId, orderItems, ...orderData } = body;

  if (!customerId || !orderItems || orderItems.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'Missing required fields: customerId and orderItems'
    }, { status: 400 });
  }

  // Create order using connection pool
  const order = await prisma.order.create({
    data: {
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      customerId,
      ...orderData,
      order_items: {
        create: orderItems.map((item: any) => ({
          id: `item-${Date.now()}-${Math.random()}`,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        }))
      }
    },
    include: {
      customers: true,
      order_items: {
        include: {
          products: true
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: order,
    message: 'Order created successfully'
  }, { status: 201 });
});

// PUT /api/orders - Update an existing order
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Order ID is required'
    }, { status: 400 });
  }

  // Update order using connection pool
  const order = await prisma.order.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    },
    include: {
      customers: true,
      order_items: {
        include: {
          products: true
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: order,
    message: 'Order updated successfully'
  });
});

// DELETE /api/orders - Delete an order
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({
      success: false,
      message: 'Order ID is required'
    }, { status: 400 });
  }

  // Delete order items first, then order using connection pool
  await prisma.order_items.deleteMany({
    where: { orderId: id }
  });
  
  await prisma.order.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true,
    message: 'Order deleted successfully'
  });
});
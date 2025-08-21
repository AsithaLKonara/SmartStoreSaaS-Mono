import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get orders with advanced filtering and status tracking
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get orders with relations
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
        deliveries: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 status changes
        },
        _count: {
          select: {
            orderItems: true,
            payments: true,
            deliveries: true,
            statusHistory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    // Get order statistics
    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { status: true },
      _sum: { total: true },
    });

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: stats,
    });
  } catch (error) {
    console.error('Advanced orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update order status with history tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, newStatus, reason, notes } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({
        error: 'Order ID and new status are required',
      }, { status: 400 });
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusHistory: true },
    });

    if (!currentOrder) {
      return NextResponse.json({
        error: 'Order not found',
      }, { status: 404 });
    }

    // Update order status and create history record
    const result = await prisma.$transaction(async (tx) => {
      // Create status history record
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: currentOrder.status,
          newStatus,
          reason: reason || null,
          notes: notes || null,
          changedBy: session.user.id,
        },
      });

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
        include: {
          customer: true,
          orderItems: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Fulfill order (mark as shipped/delivered)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, fulfillmentType, trackingNumber, courierId, estimatedDelivery } = body;

    if (!orderId || !fulfillmentType) {
      return NextResponse.json({
        error: 'Order ID and fulfillment type are required',
      }, { status: 400 });
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!currentOrder) {
      return NextResponse.json({
        error: 'Order not found',
      }, { status: 404 });
    }

    // Update order and create delivery record
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: fulfillmentType === 'SHIPPED' ? 'SHIPPED' : 'DELIVERED',
          updatedAt: new Date(),
        },
      });

      // Create delivery record
      if (fulfillmentType === 'SHIPPED') {
        await tx.delivery.create({
          data: {
            trackingNumber: trackingNumber || `DEL-${Date.now()}`,
            status: 'IN_TRANSIT',
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
            organizationId: currentOrder.organizationId,
            orderId,
            courierId,
            customerId: currentOrder.customerId,
          },
        });
      }

      // Update inventory if delivered
      if (fulfillmentType === 'DELIVERED') {
        for (const item of currentOrder.orderItems) {
          await tx.inventoryMovement.create({
            data: {
              type: 'SALE',
              quantity: -item.quantity,
              organizationId: currentOrder.organizationId,
              productId: item.productId,
              warehouseId: null, // Could be set based on fulfillment location
              reference: `Order ${orderId}`,
              notes: 'Order fulfilled',
            },
          });
        }
      }

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: `Order ${fulfillmentType.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    console.error('Order fulfillment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

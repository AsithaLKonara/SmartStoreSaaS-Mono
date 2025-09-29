import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// GET - Get orders with advanced filtering and status tracking
async function getAdvancedOrders(request: AuthRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = request.user!.organizationId;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
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
      _sum: { totalAmount: true },
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
async function updateOrderStatus(request: AuthRequest) {
  try {
    const body = await request.json();
    const { orderId, status, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: request.user!.organizationId
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = createAuthHandler(getAdvancedOrders, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ORDERS_READ],
});

export const POST = createAuthHandler(updateOrderStatus, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ORDERS_WRITE],
});
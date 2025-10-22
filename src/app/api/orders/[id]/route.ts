import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

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
        deliveries: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    logger.info({
      message: 'Order fetched successfully',
      context: {
        userId: session.user.id,
        orderId
      }
    });

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch order',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for MANAGER or higher
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orderId = params.id;
    const body = await request.json();
    const { status, notes, trackingNumber } = body;

    // Validate status if provided
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      }, { status: 400 });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
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

    logger.info({
      message: 'Order updated successfully',
      context: {
        userId: session.user.id,
        orderId,
        status,
        trackingNumber
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to update order',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for SUPER_ADMIN only
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orderId = params.id;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Delete order (this will cascade delete order items)
    await prisma.order.delete({
      where: { id: orderId }
    });

    logger.info({
      message: 'Order deleted successfully',
      context: {
        userId: session.user.id,
        orderId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to delete order',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
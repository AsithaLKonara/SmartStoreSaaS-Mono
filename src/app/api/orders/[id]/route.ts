import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Order update schema
const updateOrderSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  shippingMethod: z.string().min(1, 'Shipping method must not be empty').optional(),
  paymentMethod: z.string().min(1, 'Payment method must not be empty').optional(),
  notes: z.string().optional(),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  billingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional()
});

// GET /api/orders/[id] - Get order by ID
async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: request.user!.organizationId
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: true, price: true }
            }
          }
        },
        payments: {
          select: { id: true, amount: true, status: true, method: true, gateway: true, createdAt: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order (Admin/Manager/Staff only)
async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();

    // Validate input
    const validationResult = updateOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if order exists and belongs to user's organization
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: request.user!.organizationId
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Check if order can be updated (not completed/cancelled)
    if (existingOrder.status === 'COMPLETED' || existingOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, message: 'Cannot update completed or cancelled orders' },
        { status: 400 }
      );
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: true, price: true }
            }
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ORDER_UPDATED',
        description: `Order ${updatedOrder.orderNumber} updated`,
        userId: request.user!.userId,
        metadata: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          changes: Object.keys(updateData),
          previousStatus: existingOrder.status,
          newStatus: updatedOrder.status
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { order: updatedOrder },
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id]/status - Update order status specifically
async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();

    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to user's organization
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: request.user!.organizationId
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        notes: notes ? `${existingOrder.notes || ''}\n[${new Date().toISOString()}] Status changed to ${status}: ${notes}`.trim() : existingOrder.notes
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ORDER_STATUS_CHANGED',
        description: `Order ${updatedOrder.orderNumber} status changed to ${status}`,
        userId: request.user!.userId,
        metadata: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          previousStatus: existingOrder.status,
          newStatus: status,
          notes
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { order: updatedOrder },
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(GET);
export const PUT = withProtection(['ADMIN', 'MANAGER', 'STAFF'])(PUT);
export const PATCH = withProtection(['ADMIN', 'MANAGER', 'STAFF'])(PATCH);

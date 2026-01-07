/**
 * Returns & Refunds Management
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  CHANGED_MIND = 'CHANGED_MIND',
  DAMAGED = 'DAMAGED',
  OTHER = 'OTHER',
}

export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RECEIVED = 'RECEIVED',
  REFUNDED = 'REFUNDED',
  COMPLETED = 'COMPLETED',
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = 'ORIGINAL_PAYMENT',
  STORE_CREDIT = 'STORE_CREDIT',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * Create return request
 */
export async function createReturnRequest(data: {
  orderId: string;
  items: Array<{ orderItemId: string; quantity: number; reason: ReturnReason }>;
  notes?: string;
  refundMethod?: RefundMethod;
}): Promise<{ success: boolean; returnRequest?: any; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Validate items
    for (const item of data.items) {
      const orderItem = order.orderItems.find(oi => oi.id === item.orderItemId);
      if (!orderItem) {
        return { success: false, error: `Order item ${item.orderItemId} not found` };
      }
      if (item.quantity > orderItem.quantity) {
        return { success: false, error: 'Return quantity exceeds ordered quantity' };
      }
    }

    // Calculate refund amount
    const refundAmount = data.items.reduce((sum, item) => {
      const orderItem = order.orderItems.find(oi => oi.id === item.orderItemId);
      return sum + (orderItem ? Number(orderItem.price) * item.quantity : 0);
    }, 0);

    const returnRequest = await prisma.return.create({
      data: {
        orderId: data.orderId,
        customerId: order.customerId,
        status: ReturnStatus.REQUESTED,
        refundMethod: data.refundMethod || RefundMethod.ORIGINAL_PAYMENT,
        refundAmount,
        notes: data.notes,
        items: {
          create: data.items.map(item => {
            const orderItem = order.orderItems.find(oi => oi.id === item.orderItemId);
            return {
              orderItemId: item.orderItemId,
              productId: orderItem!.productId,
              quantity: item.quantity,
              reason: item.reason,
              refundAmount: Number(orderItem!.price) * item.quantity,
            };
          }),
        },
      },
      include: {
        items: true,
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    return { success: true, returnRequest };
  } catch (error: any) {
    logger.error({
      message: 'Create return request error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ReturnManager', operation: 'createReturnRequest', orderId: data.orderId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Approve return request
 */
export async function approveReturnRequest(
  returnId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.return.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.APPROVED,
        approvedAt: new Date(),
        adminNotes: notes,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Approve return error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ReturnManager', operation: 'approveReturn', returnId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Reject return request
 */
export async function rejectReturnRequest(
  returnId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.return.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.REJECTED,
        adminNotes: reason,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Reject return error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ReturnManager', operation: 'rejectReturn', returnId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Mark return as received
 */
export async function markReturnReceived(
  returnId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: { items: true },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return not found' };
    }

    // Restore stock
    for (const item of returnRequest.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    await prisma.return.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.RECEIVED,
        receivedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Mark received error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ReturnManager', operation: 'markReceived', returnId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Process refund
 */
export async function processRefund(
  returnId: string
): Promise<{ success: boolean; refund?: any; error?: string }> {
  try {
    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
    });

    if (!returnRequest) {
      return { success: false, error: 'Return not found' };
    }

    if (returnRequest.status !== ReturnStatus.RECEIVED) {
      return { success: false, error: 'Return must be received before refunding' };
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        returnId,
        orderId: returnRequest.orderId,
        customerId: returnRequest.customerId,
        amount: returnRequest.refundAmount,
        method: returnRequest.refundMethod,
        status: 'PROCESSED',
      },
    });

    await prisma.return.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    return { success: true, refund };
  } catch (error: any) {
    logger.error({
      message: 'Process refund error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'ReturnManager', operation: 'processRefund', returnId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get return requests
 */
export async function getReturnRequests(filters: {
  organizationId?: string;
  customerId?: string;
  status?: ReturnStatus;
  limit?: number;
}) {
  const where: any = {};

  if (filters.organizationId) {
    where.order = { organizationId: filters.organizationId };
  }
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return await prisma.return.findMany({
    where,
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      },
      order: {
        select: {
          orderNumber: true,
        },
      },
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
  });
}


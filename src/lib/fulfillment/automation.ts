/**
 * Order Fulfillment Automation
 */

import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/service';
import { logger } from '@/lib/logger';

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export interface FulfillmentRule {
  autoAllocateInventory: boolean;
  autoGeneratePackingSlip: boolean;
  autoNotifyCustomer: boolean;
  requireSignature: boolean;
  shippingMethod: string;
  warehousePriority: string[];
}

/**
 * Start fulfillment process for an order
 */
export async function startFulfillment(
  orderId: string,
  rules: Partial<FulfillmentRule> = {}
): Promise<{ success: boolean; fulfillment?: any; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Check inventory availability
    for (const item of order.orderItems) {
      if (item.product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.product.name}`,
        };
      }
    }

    // Create fulfillment record
    const fulfillment = await prisma.fulfillment.create({
      data: {
        orderId,
        status: FulfillmentStatus.PROCESSING,
        items: {
          create: order.orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Auto-allocate inventory if enabled
    if (rules.autoAllocateInventory !== false) {
      await allocateInventory(fulfillment.id);
    }

    // Auto-notify customer if enabled
    if (rules.autoNotifyCustomer !== false) {
      await notifyCustomerOrderProcessing(order);
    }

    return { success: true, fulfillment };
  } catch (error: any) {
    logger.error({
      message: 'Start fulfillment error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'FulfillmentAutomation', operation: 'startFulfillment', orderId: data.orderId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Allocate inventory for fulfillment
 */
async function allocateInventory(fulfillmentId: string): Promise<void> {
  const fulfillment = await prisma.fulfillment.findUnique({
    where: { id: fulfillmentId },
    include: {
      items: true,
      order: {
        include: {
          orderItems: true,
        },
      },
    },
  });

  if (!fulfillment) return;

  // Reserve stock
  for (const item of fulfillment.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  }

  await prisma.fulfillment.update({
    where: { id: fulfillmentId },
    data: {
      status: FulfillmentStatus.PICKING,
    },
  });
}

/**
 * Mark items as picked
 */
export async function markItemsPicked(
  fulfillmentId: string,
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.fulfillmentItem.updateMany({
      where: {
        id: { in: itemIds },
        fulfillmentId,
      },
      data: {
        status: 'PICKED',
      },
    });

    // Check if all items are picked
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { items: true },
    });

    const allPicked = fulfillment?.items.every(i => i.status === 'PICKED');

    if (allPicked) {
      await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: FulfillmentStatus.PACKING,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Mark picked error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'FulfillmentAutomation', operation: 'markPicked', fulfillmentId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Mark fulfillment as packed
 */
export async function markAsPacked(
  fulfillmentId: string,
  packingDetails: {
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    trackingNumber?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: {
        status: FulfillmentStatus.READY_TO_SHIP,
        weight: packingDetails.weight,
        dimensions: packingDetails.dimensions as any,
        trackingNumber: packingDetails.trackingNumber,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Mark packed error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'FulfillmentAutomation', operation: 'markPacked', fulfillmentId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Mark fulfillment as shipped
 */
export async function markAsShipped(
  fulfillmentId: string,
  shippingDetails: {
    carrier: string;
    trackingNumber: string;
    shippedAt?: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const fulfillment = await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: {
        status: FulfillmentStatus.SHIPPED,
        carrier: shippingDetails.carrier,
        trackingNumber: shippingDetails.trackingNumber,
        shippedAt: shippingDetails.shippedAt || new Date(),
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: fulfillment.orderId },
      data: {
        status: 'SHIPPED',
      },
    });

    // Notify customer
    await notifyCustomerShipped(fulfillment.order, shippingDetails.trackingNumber);

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Mark shipped error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'FulfillmentAutomation', operation: 'markShipped', fulfillmentId, trackingNumber }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Notify customer order is processing
 */
async function notifyCustomerOrderProcessing(order: any): Promise<void> {
  // Would send email/SMS notification
  logger.info({
    message: 'Notify customer order processing',
    context: { service: 'FulfillmentAutomation', operation: 'notifyCustomerOrderProcessing', orderId: order.id, orderNumber: order.orderNumber, customerEmail: order.customer.email }
  });
}

/**
 * Notify customer order is shipped
 */
async function notifyCustomerShipped(order: any, trackingNumber: string): Promise<void> {
  // Would send email/SMS notification
  logger.info({
    message: 'Notify customer order shipped',
    context: { service: 'FulfillmentAutomation', operation: 'notifyCustomerShipped', orderId: order.id, orderNumber: order.orderNumber, customerEmail: order.customer.email, trackingNumber }
  });
}

/**
 * Get fulfillment status
 */
export async function getFulfillmentStatus(orderId: string) {
  return await prisma.fulfillment.findFirst({
    where: { orderId },
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
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get pending fulfillments
 */
export async function getPendingFulfillments(organizationId: string) {
  return await prisma.fulfillment.findMany({
    where: {
      order: {
        organizationId,
      },
      status: {
        in: [
          FulfillmentStatus.PENDING,
          FulfillmentStatus.PROCESSING,
          FulfillmentStatus.PICKING,
          FulfillmentStatus.PACKING,
          FulfillmentStatus.READY_TO_SHIP,
        ],
      },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      },
      items: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}


/**
 * Purchase Order Management
 */

import { prisma } from '@/lib/prisma';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Create purchase order
 */
export async function createPurchaseOrder(data: {
  organizationId: string;
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
  expectedDeliveryDate?: Date;
  notes?: string;
}): Promise<{ success: boolean; purchaseOrder?: any; error?: string }> {
  try {
    // Generate PO number
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${String(count + 1).padStart(6, '0')}`;

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        organizationId: data.organizationId,
        supplierId: data.supplierId,
        orderNumber: poNumber,
        status: PurchaseOrderStatus.DRAFT,
        subtotal,
        tax,
        total,
        expectedDeliveryDate: data.expectedDeliveryDate,
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            receivedQuantity: 0,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
          })),
        },
      },
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
        supplier: {
          select: {
            name: true,
            contactPerson: true,
          },
        },
      },
    });

    return { success: true, purchaseOrder };
  } catch (error: any) {
    console.error('Create PO error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Approve purchase order
 */
export async function approvePurchaseOrder(
  poId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: PurchaseOrderStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Approve PO error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send purchase order to supplier
 */
export async function sendPurchaseOrder(
  poId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: PurchaseOrderStatus.ORDERED,
        orderedAt: new Date(),
      },
      include: {
        supplier: true,
      },
    });

    // Would send email to supplier
    console.log(`Sending PO ${po.orderNumber} to ${po.supplier.email}`);

    return { success: true };
  } catch (error: any) {
    console.error('Send PO error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Receive purchase order items
 */
export async function receivePurchaseOrderItems(
  poId: string,
  receivedItems: Array<{
    itemId: string;
    receivedQuantity: number;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!po) {
      return { success: false, error: 'Purchase order not found' };
    }

    // Update received quantities and stock
    for (const receivedItem of receivedItems) {
      const item = po.items.find(i => i.id === receivedItem.itemId);
      if (!item) continue;

      const newReceivedQuantity = item.receivedQuantity + receivedItem.receivedQuantity;

      await prisma.purchaseOrderItem.update({
        where: { id: receivedItem.itemId },
        data: {
          receivedQuantity: newReceivedQuantity,
        },
      });

      // Update product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: receivedItem.receivedQuantity,
          },
        },
      });
    }

    // Check if all items received
    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    const allReceived = updatedPO?.items.every(i => i.receivedQuantity >= i.quantity);
    const partiallyReceived = updatedPO?.items.some(i => i.receivedQuantity > 0);

    let newStatus = po.status;
    if (allReceived) {
      newStatus = PurchaseOrderStatus.RECEIVED;
    } else if (partiallyReceived) {
      newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: newStatus,
        receivedAt: allReceived ? new Date() : undefined,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Receive items error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete purchase order
 */
export async function completePurchaseOrder(
  poId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: PurchaseOrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Update supplier stats
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: {
        supplierId: true,
        total: true,
      },
    });

    if (po) {
      await prisma.supplier.update({
        where: { id: po.supplierId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: Number(po.total) },
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Complete PO error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel purchase order
 */
export async function cancelPurchaseOrder(
  poId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: PurchaseOrderStatus.CANCELLED,
        cancelReason: reason,
        cancelledAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Cancel PO error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get purchase orders
 */
export async function getPurchaseOrders(organizationId: string, filters?: {
  status?: PurchaseOrderStatus;
  supplierId?: string;
}) {
  const where: any = { organizationId };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.supplierId) {
    where.supplierId = filters.supplierId;
  }

  return await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: {
        select: {
          name: true,
        },
      },
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


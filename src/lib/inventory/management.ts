/**
 * Advanced Inventory Management
 */

import { prisma } from '@/lib/prisma';

export interface StockMovement {
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  reason?: string;
  warehouseId?: string;
  reference?: string;
}

/**
 * Record stock movement
 */
export async function recordStockMovement(
  movement: StockMovement,
  organizationId: string
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: movement.productId },
      select: { stock: true, organizationId: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.organizationId !== organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Calculate new stock
    let newStock = product.stock;
    if (movement.type === 'IN') {
      newStock += movement.quantity;
    } else if (movement.type === 'OUT') {
      if (newStock < movement.quantity) {
        return { success: false, error: 'Insufficient stock' };
      }
      newStock -= movement.quantity;
    } else if (movement.type === 'ADJUSTMENT') {
      newStock = movement.quantity;
    }

    // Update product stock
    await prisma.product.update({
      where: { id: movement.productId },
      data: { stock: newStock },
    });

    // Record movement in history
    await prisma.stockMovement.create({
      data: {
        productId: movement.productId,
        quantity: movement.quantity,
        type: movement.type,
        previousStock: product.stock,
        newStock,
        reason: movement.reason,
        warehouseId: movement.warehouseId,
        reference: movement.reference,
        organizationId,
      },
    });

    return { success: true, newStock };
  } catch (error: any) {
    console.error('Stock movement error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if products need reordering
 */
export async function getReorderList(organizationId: string) {
  const products = await prisma.product.findMany({
    where: {
      organizationId,
      OR: [
        { stock: { lte: prisma.raw('minStock') } },
        { stock: 0 },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minStock: true,
      price: true,
    },
    orderBy: {
      stock: 'asc',
    },
  });

  return products.map(p => ({
    ...p,
    reorderQuantity: Math.max(p.minStock * 2 - p.stock, p.minStock),
    priority: p.stock === 0 ? 'HIGH' : 'MEDIUM',
  }));
}

/**
 * Get stock movement history
 */
export async function getStockHistory(
  productId: string,
  limit: number = 50
) {
  return await prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      warehouse: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Batch update stock levels
 */
export async function batchUpdateStock(
  updates: Array<{ productId: string; quantity: number }>,
  organizationId: string
): Promise<{
  success: boolean;
  updated: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: true,
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const update of updates) {
    const result = await recordStockMovement(
      {
        productId: update.productId,
        quantity: update.quantity,
        type: 'ADJUSTMENT',
        reason: 'Batch update',
      },
      organizationId
    );

    if (result.success) {
      results.updated++;
    } else {
      results.failed++;
      results.errors.push(`${update.productId}: ${result.error}`);
    }
  }

  results.success = results.failed === 0;
  return results;
}

/**
 * Calculate inventory value
 */
export async function calculateInventoryValue(organizationId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId },
    select: {
      stock: true,
      cost: true,
      price: true,
    },
  });

  const costValue = products.reduce((sum, p) => sum + (p.stock * Number(p.cost || 0)), 0);
  const retailValue = products.reduce((sum, p) => sum + (p.stock * Number(p.price)), 0);

  return {
    costValue,
    retailValue,
    potentialProfit: retailValue - costValue,
    items: products.length,
    totalUnits: products.reduce((sum, p) => sum + p.stock, 0),
  };
}


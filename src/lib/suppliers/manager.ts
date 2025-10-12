/**
 * Supplier Management System
 */

import { prisma } from '@/lib/prisma';

export interface SupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  leadTime?: number; // in days
  minimumOrderValue?: number;
  isActive: boolean;
}

/**
 * Create supplier
 */
export async function createSupplier(
  data: SupplierData & { organizationId: string }
): Promise<{ success: boolean; supplier?: any; error?: string }> {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        rating: 0,
        totalOrders: 0,
        totalSpent: 0,
      },
    });

    return { success: true, supplier };
  } catch (error: any) {
    console.error('Create supplier error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update supplier
 */
export async function updateSupplier(
  supplierId: string,
  data: Partial<SupplierData>
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.supplier.update({
      where: { id: supplierId },
      data,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Update supplier error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get suppliers
 */
export async function getSuppliers(organizationId: string, filters?: {
  isActive?: boolean;
  search?: string;
}) {
  const where: any = { organizationId };

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { contactPerson: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.supplier.findMany({
    where,
    include: {
      purchaseOrders: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get supplier by ID
 */
export async function getSupplier(supplierId: string) {
  return await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
      },
      supplierProducts: {
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
  });
}

/**
 * Link product to supplier
 */
export async function linkProductToSupplier(data: {
  supplierId: string;
  productId: string;
  supplierSku?: string;
  cost: number;
  leadTime: number;
  minimumOrderQuantity?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.supplierProduct.create({
      data,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Link product error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rate supplier
 */
export async function rateSupplier(
  supplierId: string,
  rating: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return { success: false, error: 'Supplier not found' };
    }

    // Calculate new average rating
    const totalRatings = supplier.totalRatings || 0;
    const currentRating = supplier.rating || 0;
    const newTotalRatings = totalRatings + 1;
    const newAverageRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        rating: newAverageRating,
        totalRatings: newTotalRatings,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Rate supplier error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get supplier performance metrics
 */
export async function getSupplierPerformance(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      purchaseOrders: {
        where: {
          status: 'COMPLETED',
        },
      },
    },
  });

  if (!supplier) {
    return null;
  }

  const totalOrders = supplier.purchaseOrders.length;
  const totalSpent = supplier.purchaseOrders.reduce((sum, po) => sum + Number(po.total), 0);
  
  // Calculate on-time delivery rate (would need delivery dates)
  const onTimeRate = 0.95; // Placeholder

  return {
    supplierId: supplier.id,
    name: supplier.name,
    rating: supplier.rating,
    totalOrders,
    totalSpent,
    onTimeDeliveryRate: onTimeRate,
    averageLeadTime: supplier.leadTime || 0,
  };
}


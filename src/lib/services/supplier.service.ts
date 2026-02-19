import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class SupplierService {
    /**
     * List suppliers with scoping and pagination
     */
    static async getSuppliers(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const { organizationId, page = 1, limit = 20, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.SupplierWhereInput = {
            organizationId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.supplier.count({ where }),
        ]);

        return {
            suppliers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Create a new purchase order
     */
    static async createPurchaseOrder(data: {
        supplierId: string;
        organizationId: string;
        items: Array<{
            productId: string;
            quantity: number;
            unitCost: number;
        }>;
        notes?: string;
        createdById?: string;
        origin?: 'human' | 'ai';
    }) {
        const { supplierId, organizationId, items, notes, createdById, origin = 'human' } = data;

        const poNumber = `PO-${Date.now()}`;
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

        return prisma.$transaction(async (tx) => {
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    orderNumber: poNumber, // schema field is orderNumber
                    supplierId,
                    organizationId,
                    subtotal: totalAmount,
                    total: totalAmount,
                    status: 'DRAFT', // standard status
                    notes,
                    createdById: createdById || '',
                    createdByOrigin: origin,
                },
            });

            if (items.length > 0) {
                await tx.purchaseOrderItem.createMany({
                    data: items.map(item => ({
                        purchaseOrderId: purchaseOrder.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitCost,
                        total: item.quantity * item.unitCost,
                    })),
                });
            }

            return tx.purchaseOrder.findUnique({
                where: { id: purchaseOrder.id },
                include: {
                    supplier: true,
                    items: true,
                },
            });
        });
    }

    /**
     * Complete purchase order and update supplier performance metrics
     */
    static async completePurchaseOrder(poId: string, organizationId: string) {
        return prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { id: poId, organizationId },
                include: { items: true }
            });

            if (!po) throw new Error('Purchase order not found');

            const completedAt = new Date();
            const leadTimeDays = Math.ceil((completedAt.getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24));

            // 1. Update PO Status
            const updatedPO = await tx.purchaseOrder.update({
                where: { id: poId },
                data: {
                    status: 'COMPLETED',
                    completedAt,
                    receivedDate: completedAt
                }
            });

            // 2. Update Supplier lead time
            await tx.supplier.update({
                where: { id: po.supplierId },
                data: {
                    leadTime: leadTimeDays, // Simple update for now, could be moving average
                    totalOrders: { increment: 1 },
                    totalSpent: { increment: po.total }
                }
            });

            // 3. Update SupplierProduct lead times
            for (const item of po.items) {
                await tx.supplierProduct.updateMany({
                    where: {
                        supplierId: po.supplierId,
                        productId: item.productId
                    },
                    data: {
                        leadTime: leadTimeDays
                    }
                });
            }

            return updatedPO;
        });
    }

    /**
     * Update purchase order status (AI Supply Chain Support)
     */
    static async updatePOStatus(poId: string, organizationId: string, status: string) {
        return prisma.purchaseOrder.update({
            where: { id: poId, organizationId },
            data: { status },
        });
    }
}

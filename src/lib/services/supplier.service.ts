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
                        unitCost: item.unitCost,
                        totalCost: item.quantity * item.unitCost,
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
     * Update purchase order status (AI Supply Chain Support)
     */
    static async updatePOStatus(poId: string, organizationId: string, status: string) {
        return prisma.purchaseOrder.update({
            where: { id: poId, organizationId },
            data: { status },
        });
    }
}

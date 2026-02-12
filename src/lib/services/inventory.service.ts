import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class InventoryService {
    /**
     * List inventory items with scoping and pagination
     */
    static async getInventory(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
    }) {
        const { organizationId, page = 1, limit = 10, search, categoryId } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {
            organizationId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Create a new inventory item (product)
     */
    static async createProduct(data: {
        name: string;
        sku: string;
        price: number;
        cost?: number;
        stock?: number;
        minStock?: number;
        categoryId?: string;
        organizationId: string;
        description?: string;
        createdById?: string;
    }) {
        const {
            name,
            sku,
            price,
            cost = 0,
            stock = 0,
            minStock = 0,
            categoryId,
            organizationId,
            description = '',
            createdById,
        } = data;

        return prisma.product.create({
            data: {
                name,
                sku,
                price,
                cost,
                stock,
                minStock,
                categoryId: categoryId || null,
                organizationId,
                description,
                createdById,
                isActive: true,
            },
            include: {
                category: true,
            },
        });
    }

    /**
     * Adjust inventory quantity
     */
    static async adjustStock(params: {
        productId: string;
        organizationId: string;
        adjustment: number;
        reason: string;
        userId?: string;
    }) {
        const { productId, organizationId, adjustment, reason, userId } = params;

        return prisma.$transaction(async (tx) => {
            const product = await tx.product.update({
                where: { id: productId, organizationId },
                data: {
                    stock: { increment: adjustment },
                },
            });

            await tx.inventoryMovement.create({
                data: {
                    productId,
                    quantity: adjustment,
                    type: adjustment > 0 ? 'IN' : 'OUT',
                    reason,
                    reference: userId ? `User: ${userId}` : 'System',
                },
            });

            return product;
        });
    }

    /**
     * Get low stock items
     */
    static async getLowStock(organizationId: string) {
        return prisma.product.findMany({
            where: {
                organizationId,
                stock: {
                    lte: prisma.product.fields.minStock,
                },
            },
            include: {
                category: true,
            },
        });
    }
}

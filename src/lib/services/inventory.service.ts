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
        origin?: 'human' | 'ai';
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
            origin = 'human',
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
                createdByOrigin: origin,
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

    /**
     * Run autonomous inventory check for an organization
     * (Consolidated from InventoryAutopilotService)
     */
    static async runAutopilot(organizationId: string) {
        const { SalesVelocityService } = await import('./sales-velocity.service');
        const { AIBrainService } = await import('./ai-brain.service');
        const { SupplierService } = await import('./supplier.service');

        logger.info({
            message: 'Inventory Autopilot started',
            context: { organizationId }
        });

        try {
            // 1. Detection: Find low stock items
            const lowStockItems = await this.getLowStock(organizationId);

            if (lowStockItems.length === 0) {
                logger.info({
                    message: 'Inventory Autopilot: No low stock items found',
                    context: { organizationId }
                });
                return { processed: 0, actions: [] };
            }

            const results = [];

            for (const product of lowStockItems) {
                // 2. Context Building
                const velocity = await SalesVelocityService.getProductVelocity({
                    productId: product.id,
                    organizationId,
                    days: 30
                });

                const supplierProducts = await prisma.supplierProduct.findMany({
                    where: { productId: product.id },
                    include: { supplier: true }
                });

                const context = {
                    inventory: [product],
                    salesVelocity: velocity,
                    leadTimes: supplierProducts.map(sp => ({
                        supplierId: sp.supplierId,
                        supplierName: sp.supplier.name,
                        leadTime: sp.leadTime,
                        cost: Number(sp.cost),
                        minOrderQty: sp.minimumOrderQuantity
                    })),
                    analytics: {
                        daysRemaining: velocity.unitsPerDay > 0
                            ? Math.floor(product.stock / velocity.unitsPerDay)
                            : Infinity
                    }
                };

                // 3. Decision
                const decision = await AIBrainService.decideNextAction(context as any);

                // 4. Action
                if (decision.action === 'CREATE_PURCHASE_ORDER') {
                    const poData = decision.data;

                    // Verify supplier exists for this product
                    const bestSupplier = supplierProducts.find(sp => sp.supplierId === poData.supplierId)
                        || supplierProducts[0];

                    if (bestSupplier) {
                        const po = await SupplierService.createPurchaseOrder({
                            supplierId: bestSupplier.supplierId,
                            organizationId,
                            items: [{
                                productId: product.id,
                                quantity: poData.quantity || 50,
                                unitCost: Number(bestSupplier.cost)
                            }],
                            notes: `AI Decision: ${decision.reason}`,
                            origin: 'ai'
                        });

                        if (po) {
                            results.push({
                                productId: product.id,
                                action: 'PO_CREATED',
                                poId: po.id,
                                reason: decision.reason
                            });

                            logger.info({
                                message: 'Inventory Autopilot: PO Created',
                                context: { product: product.sku, poId: po.id, reason: decision.reason }
                            });
                        }
                    }
                } else {
                    results.push({
                        productId: product.id,
                        action: 'SKIPPED',
                        reason: decision.reason
                    });
                }
            }

            return {
                processed: lowStockItems.length,
                results
            };

        } catch (error) {
            logger.error({
                message: 'Inventory Autopilot failed',
                error: error instanceof Error ? error : new Error(String(error)),
                context: { organizationId }
            });
            throw error;
        }
    }
}

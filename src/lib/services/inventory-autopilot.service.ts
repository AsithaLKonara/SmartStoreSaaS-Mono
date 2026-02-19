import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { InventoryService } from './inventory.service';
import { SalesVelocityService } from './sales-velocity.service';
import { AIBrainService, AIContext } from './ai-brain.service';
import { SupplierService } from './supplier.service';

export class InventoryAutopilotService {
    /**
     * Run autonomous inventory check for an organization
     */
    static async run(organizationId: string) {
        logger.info({
            message: 'Inventory Autopilot started',
            context: { organizationId }
        });

        try {
            // 1. Detection: Find low stock items
            const lowStockItems = await InventoryService.getLowStock(organizationId);

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

                const context: AIContext = {
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
                const decision = await AIBrainService.decideNextAction(context);

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

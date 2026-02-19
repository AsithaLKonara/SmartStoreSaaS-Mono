import { prisma } from '@/lib/prisma';
import { SalesVelocityService } from './sales-velocity.service';
import { AIBrainService, AIContext } from './ai-brain.service';

export interface PricingRecommendation {
    productId: string;
    productSku: string;
    currentPrice: number;
    recommendedPrice: number;
    reason: string;
    confidence: number;
}

export class DynamicPricingService {
    /**
     * Analyze products and suggest price optimizations using AI Brain
     */
    static async getPriceRecommendations(organizationId: string): Promise<PricingRecommendation[]> {
        const products = await prisma.product.findMany({
            where: { organizationId, isActive: true },
            include: { category: true }
        });

        const recommendations: PricingRecommendation[] = [];

        for (const product of products) {
            const velocity = await SalesVelocityService.getProductVelocity({
                productId: product.id,
                organizationId
            });

            const context: AIContext = {
                inventory: [product],
                salesVelocity: velocity,
                analytics: {
                    stockRatio: product.minStock > 0 ? product.stock / product.minStock : 10
                }
            };

            const decision = await AIBrainService.decideNextAction(context);

            if (decision.action === 'UPDATE_PRODUCT_PRICE') {
                recommendations.push({
                    productId: product.id,
                    productSku: product.sku,
                    currentPrice: Number(product.price),
                    recommendedPrice: decision.data.newPrice,
                    reason: decision.reason,
                    confidence: 0.9 // Default confidence for AI suggestions
                });
            }
        }

        return recommendations;
    }
}

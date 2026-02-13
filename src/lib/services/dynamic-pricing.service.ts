import { prisma } from '@/lib/prisma';
import { SalesVelocityService } from './sales-velocity.service';
import { InventoryService } from './inventory.service';
import { logger } from '@/lib/logger';

export interface PricingRecommendation {
    productId: string;
    currentPrice: number;
    recommendedPrice: number;
    reason: string;
    confidence: number;
}

export class DynamicPricingService {
    /**
     * Analyze products and suggest price optimizations
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

            const recommendation = this.analyzePrice(product, velocity);
            if (recommendation) {
                recommendations.push(recommendation);
            }
        }

        return recommendations;
    }

    private static analyzePrice(product: any, velocity: any): PricingRecommendation | null {
        const currentPrice = Number(product.price);
        const stock = product.stock;
        const minStock = product.minStock;
        const unitsPerDay = velocity.unitsPerDay;

        // Logic 1: High Demand + Low Stock = Price Increase
        if (unitsPerDay > 5 && stock < minStock * 2) {
            return {
                productId: product.id,
                currentPrice,
                recommendedPrice: Number((currentPrice * 1.05).toFixed(2)),
                reason: `High demand (${unitsPerDay} units/day) and low stock (${stock}) detected. Suggesting 5% increase to optimize margin.`,
                confidence: 0.85
            };
        }

        // Logic 2: Low Demand + High Stock = Price Decrease
        if (unitsPerDay < 1 && stock > minStock * 5 && stock > 50) {
            return {
                productId: product.id,
                currentPrice,
                recommendedPrice: Number((currentPrice * 0.90).toFixed(2)),
                reason: `Slow moving stock detected (${unitsPerDay} units/day with ${stock} in hand). Suggesting 10% discount to clear inventory.`,
                confidence: 0.75
            };
        }

        return null;
    }
}

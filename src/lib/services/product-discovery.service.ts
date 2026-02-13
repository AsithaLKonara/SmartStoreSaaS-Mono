import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class ProductDiscoveryService {
    /**
     * Search for products based on natural language query
     */
    static async findProducts(params: {
        query: string;
        organizationId: string;
        limit?: number;
    }) {
        const { query, organizationId, limit = 5 } = params;

        // Simple implementation for now: case-insensitive search in name and description
        // In future phases, this can be upgraded to Vector Search (Phase 5 of original plan)
        const products = await prisma.product.findMany({
            where: {
                organizationId,
                isActive: true,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { tags: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: limit,
            include: {
                category: true,
                variants: true
            }
        });

        return products;
    }

    /**
     * Get specific details for a product including stock
     */
    static async getProductDetails(sku: string, organizationId: string) {
        return prisma.product.findFirst({
            where: { sku, organizationId },
            include: { variants: true }
        });
    }
}

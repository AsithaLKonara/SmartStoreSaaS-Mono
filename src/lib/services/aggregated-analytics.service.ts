import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class AggregatedAnalyticsService {
    /**
     * Get global category trends across all organizations (Anonymized)
     */
    static async getGlobalCategoryTrends() {
        const today = new Date();
        today.setDate(today.getDate() - 30); // Last 30 days

        // Group sales by Category across ALL organizations
        // Note: This requires products to have consistent categories or we group by category name
        const categorySales = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
                total: true
            },
            where: {
                createdAt: { gte: today }
            },
            orderBy: {
                _sum: { total: 'desc' }
            },
            take: 20
        });

        // Resolve Product Categories (This is expensive in loop, optimization needed for scale)
        // For MVP, we fetch product details for top items
        const trends = [];
        for (const item of categorySales) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { category: true }
            });

            if (product?.category) {
                trends.push({
                    category: product.category.name,
                    volume: item._sum.quantity,
                    revenue: item._sum.total
                });
            }
        }

        // In a real implementation, we would aggregate by category ID directly if feasible
        // or use a dedicated analytics table.
        return trends;
    }

    /**
     * Benchmark an organization against global averages
     */
    static async getBenchmark(organizationId: string) {
        const today = new Date();
        today.setDate(today.getDate() - 30);

        const [orgStats, globalStats] = await Promise.all([
            this.getOrgStats(organizationId, today),
            this.getGlobalStats(today)
        ]);

        return {
            organizationId,
            metrics: {
                aov: orgStats.aov,
                orders: orgStats.count
            },
            benchmark: {
                globalAov: globalStats.aov,
                percentile: orgStats.aov > globalStats.aov ? 'Above Average' : 'Below Average'
            },
            insight: orgStats.aov > globalStats.aov
                ? 'Great job! Your Average Order Value is higher than the platform average.'
                : 'Tip: Consider critical upselling to specific bundles to increase AOV to global standards.'
        };
    }

    private static async getOrgStats(organizationId: string, startDate: Date) {
        const aggregates = await prisma.order.aggregate({
            where: { organizationId, createdAt: { gte: startDate } },
            _avg: { total: true },
            _count: { id: true }
        });
        return { aov: Number(aggregates._avg.total || 0), count: aggregates._count.id };
    }

    private static async getGlobalStats(startDate: Date) {
        const aggregates = await prisma.order.aggregate({
            where: { createdAt: { gte: startDate } },
            _avg: { total: true },
            _count: { id: true }
        });
        return { aov: Number(aggregates._avg.total || 0), count: aggregates._count.id };
    }
}

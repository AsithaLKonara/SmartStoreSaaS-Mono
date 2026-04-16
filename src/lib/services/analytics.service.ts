import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export class AnalyticsService {
    /**
     * Get store summary for AI digestion
     */
    static async getStoreAnalytics(organizationId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalSales, orderCount, customerCount, lowStockCount] = await Promise.all([
            // 1. Today's Sales
            prisma.order.aggregate({
                where: {
                    organizationId,
                    createdAt: { gte: today },
                    status: { notIn: ['CANCELLED', 'REFUNDED'] }
                },
                _sum: { total: true }
            }),
            // 2. Today's Order Count
            prisma.order.count({
                where: {
                    organizationId,
                    createdAt: { gte: today }
                }
            }),
            // 3. Total Active Customers
            prisma.customer.count({
                where: { organizationId }
            }),
            // 4. Low Stock Products
            prisma.product.count({
                where: {
                    organizationId,
                    stock: { lte: prisma.product.fields.minStock }
                }
            })
        ]);

        return {
            salesToday: totalSales._sum.total || 0,
            ordersToday: orderCount,
            totalCustomers: customerCount,
            lowStockAlerts: lowStockCount,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get sales performance over time
     */
    static async getSalesPerformance(organizationId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sales = await prisma.order.findMany({
            where: {
                organizationId,
                createdAt: { gte: startDate },
                status: { notIn: ['CANCELLED', 'REFUNDED'] }
            },
            select: {
                total: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        return sales;
    }

    /**
     * Get global category trends across all organizations (Anonymized)
     * (Consolidated from AggregatedAnalyticsService)
     */
    static async getGlobalCategoryTrends() {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const categorySales = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
                total: true
            },
            where: {
                createdAt: { gte: last30Days }
            },
            orderBy: {
                _sum: { total: Prisma.SortOrder.desc }
            },
            take: 20
        });

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
        return trends;
    }

    /**
     * Benchmark an organization against global averages
     * (Consolidated from AggregatedAnalyticsService)
     */
    static async getBenchmark(organizationId: string) {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const [orgStats, globalStats] = await Promise.all([
            this.getAggregateStats(organizationId, last30Days),
            this.getAggregateStats(undefined, last30Days)
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

    private static async getAggregateStats(organizationId: string | undefined, startDate: Date) {
        const aggregates = await prisma.order.aggregate({
            where: { 
                organizationId: organizationId || undefined, 
                createdAt: { gte: startDate } 
            },
            _avg: { total: true },
            _count: { id: true }
        });
        return { 
            aov: Number(aggregates._avg.total || 0), 
            count: aggregates._count.id 
        };
    }

    /**
     * Generate daily sales snapshot
     * (Consolidated from AnalyticsSnapshotService)
     */
    static async generateDailySnapshot(date: Date, organizationId?: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const salesAggregate = await prisma.order.aggregate({
            where: {
                organizationId: organizationId || undefined,
                createdAt: { gte: startOfDay, lte: endOfDay },
                status: { in: ['DELIVERED', 'SHIPPED', 'COMPLETED'] }
            },
            _sum: { total: true },
            _count: { id: true }
        });

        await prisma.dailySalesSnapshot.upsert({
            where: {
                organizationId_date: {
                    organizationId: organizationId || null,
                    date: startOfDay,
                }
            },
            update: {
                totalSales: salesAggregate._sum.total || 0,
                orderCount: salesAggregate._count.id || 0,
            },
            create: {
                organizationId: organizationId || null,
                date: startOfDay,
                totalSales: salesAggregate._sum.total || 0,
                orderCount: salesAggregate._count.id || 0,
            }
        });
    }

    /**
     * Sync daily snapshots for all active tenants
     */
    static async syncAllActiveTenants(date: Date) {
        const tenants = await prisma.organization.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true }
        });

        // Platform-wide
        await this.generateDailySnapshot(new Date(date));

        // Individual tenants
        for (const tenant of tenants) {
            await this.generateDailySnapshot(new Date(date), tenant.id);
        }
    }
}

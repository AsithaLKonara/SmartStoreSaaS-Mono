import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
                    status: { notIn: ['CANCELLED', 'RETURNED'] }
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
                status: { notIn: ['CANCELLED', 'RETURNED'] }
            },
            select: {
                total: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        return sales;
    }
}

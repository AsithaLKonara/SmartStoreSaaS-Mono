import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AnalyticsService } from '@/lib/services/analytics.service';

export class FinancialService {
    /**
     * Generate a weekly financial digest with AI insights
     */
    static async generateWeeklyDigest(organizationId: string) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        // 1. Calculate Revenue for the week
        const weeklyRevenue = await prisma.order.aggregate({
            where: {
                organizationId,
                createdAt: { gte: startDate, lte: endDate },
                status: { notIn: ['CANCELLED', 'RETURNED'] }
            },
            _sum: { total: true }
        });

        // 2. Analyze Margins (Approximate based on product cost if available)
        // Accessing order items to estimate cost
        const orders = await prisma.order.findMany({
            where: {
                organizationId,
                createdAt: { gte: startDate, lte: endDate },
                status: { notIn: ['CANCELLED', 'RETURNED'] }
            },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        let totalCost = 0;
        let totalSales = 0;
        let productPerformance: Record<string, { revenue: number, cost: number }> = {};

        for (const order of orders) {
            totalSales += Number(order.total);
            for (const item of order.items) {
                const cost = Number(item.product.cost || 0) * item.quantity;
                totalCost += cost;

                if (!productPerformance[item.productId]) {
                    productPerformance[item.productId] = { revenue: 0, cost: 0 };
                }
                productPerformance[item.productId].revenue += Number(item.total);
                productPerformance[item.productId].cost += cost;
            }
        }

        const grossProfit = totalSales - totalCost;
        const margin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        // 3. Detect Anomalies & Generate Insights
        const insights = [];

        // Insight: Low Margin
        if (margin < 15) {
            insights.push({
                type: 'CRITICAL',
                message: `Overall margin is low (${margin.toFixed(1)}%). Review supplier costs or pricing strategy.`
            });
        }

        // Insight: Leaked Revenue (Returns)
        const returns = await prisma.order.count({
            where: {
                organizationId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'RETURNED'
            }
        });

        if (returns > 5) {
            insights.push({
                type: 'WARNING',
                message: `High return rate detected (${returns} orders returned this week). Investigate product quality.`
            });
        }

        // 4. Construct Report Data
        const reportData = {
            period: { start: startDate, end: endDate },
            financials: {
                revenue: totalSales,
                cost: totalCost,
                profit: grossProfit,
                margin: margin.toFixed(2) + '%'
            },
            insights,
            anomalies: insights.length // Simple count for now
        };

        // 5. Save Report
        const report = await prisma.report.create({
            data: {
                name: `Weekly Financial Digest - ${endDate.toISOString().split('T')[0]}`,
                type: 'FINANCIAL_DIGEST',
                organizationId,
                data: JSON.stringify(reportData),
                schedule: 'WEEKLY',
                createdById: 'ai-controller' // or link to specific user if needed
            }
        });

        logger.info({ message: 'Financial Digest Generated', context: { reportId: report.id, financials: reportData.financials } });

        return report;
    }

    /**
     * Retrieve the latest financial report
     */
    static async getLatestReport(organizationId: string) {
        return prisma.report.findFirst({
            where: { organizationId, type: 'FINANCIAL_DIGEST' },
            orderBy: { createdAt: 'desc' }
        });
    }
}

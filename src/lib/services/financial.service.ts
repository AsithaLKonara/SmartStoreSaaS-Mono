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

    /**
     * Generate actual Profit & Loss data
     */
    static async getProfitLoss(organizationId: string, startDate?: Date, endDate?: Date) {
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of month
        const end = endDate || new Date();

        // 1. Calculate Revenue (Direct Sales)
        const sales = await prisma.order.findMany({
            where: {
                organizationId,
                createdAt: { gte: start, lte: end },
                status: { notIn: ['CANCELLED', 'RETURNED'] }
            },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        let totalRevenue = 0;
        let totalCogs = 0;

        for (const order of sales) {
            totalRevenue += Number(order.total);
            for (const item of order.items) {
                totalCogs += Number(item.product.cost || 0) * item.quantity;
            }
        }

        // 2. Fetch Other Expenses from Journal Entries
        // Assuming accountType 'EXPENSE' indicates non-COGS expenses
        const expenseLines = await prisma.journalEntryLine.findMany({
            where: {
                journalEntry: {
                    organizationId,
                    entryDate: { gte: start, lte: end },
                    status: 'POSTED'
                },
                account: {
                    accountType: 'EXPENSE'
                }
            }
        });

        const otherExpenses = expenseLines.reduce((sum, line) => sum + (line.debit - line.credit), 0);

        // 3. Gross Profit
        const grossProfit = totalRevenue - totalCogs;

        // 4. Net Income
        const netIncome = grossProfit - otherExpenses;

        return {
            reportType: 'profit_loss',
            period: { start, end },
            revenue: {
                total: totalRevenue,
                sales: totalRevenue,
                other: 0 // Placeholder for other revenue types like interest
            },
            cogs: totalCogs,
            grossProfit,
            expenses: {
                total: otherExpenses,
                breakdown: [] // Could be expanded by grouping by accountName
            },
            netIncome,
            margin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
        };
    }

    /**
     * Generate actual Balance Sheet data
     */
    static async getBalanceSheet(organizationId: string) {
        // Fetch all active accounts with their current balances
        const accounts = await prisma.chartOfAccount.findMany({
            where: {
                organizationId,
                isActive: true
            }
        });

        const assets = { total: 0, breakdown: [] as any[] };
        const liabilities = { total: 0, breakdown: [] as any[] };
        const equity = { total: 0, breakdown: [] as any[] };

        for (const account of accounts) {
            const balance = Number(account.balance || 0);

            // Simple classification based on accountType
            // Standard accounting: Assets (Debit positive), Liabilities/Equity (Credit positive)
            if (['ASSET', 'BANK', 'RECEIVABLE', 'INVENTORY'].includes(account.accountType)) {
                assets.total += balance;
                assets.breakdown.push({ name: account.name, code: account.code, balance });
            } else if (['LIABILITY', 'PAYABLE', 'CREDIT_CARD'].includes(account.accountType)) {
                liabilities.total += balance;
                liabilities.breakdown.push({ name: account.name, code: account.code, balance });
            } else if (['EQUITY'].includes(account.accountType)) {
                equity.total += balance;
                equity.breakdown.push({ name: account.name, code: account.code, balance });
            }
        }

        return {
            reportType: 'balance_sheet',
            date: new Date(),
            assets: {
                total: assets.total,
                breakdown: assets.breakdown
            },
            liabilities: {
                total: liabilities.total,
                breakdown: liabilities.breakdown
            },
            equity: {
                total: equity.total,
                breakdown: equity.breakdown
            },
            isBalanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01
        };
    }
}



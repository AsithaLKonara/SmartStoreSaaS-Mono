import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

const prisma = new PrismaClient();

export interface BillingDashboard {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
  subscriptionMetrics: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    trialSubscriptions: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    averageOrderValue: number;
  };
}

export class BillingService {
  async getBillingDashboard(organizationId: string): Promise<BillingDashboard> {
    try {
      // Get total revenue
      const totalRevenue = await prisma.payment.aggregate({
        where: {
          organizationId,
          status: 'PAID'
        },
        _sum: {
          amount: true
        }
      });

      // Get monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyRevenue = await prisma.payment.aggregate({
        where: {
          organizationId,
          status: 'PAID',
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      });

      const activeSubscriptions = await prisma.subscription.count({
        where: {
          customer: { organizationId },
          status: 'ACTIVE'
        }
      });

      // Get pending payments
      const pendingPayments = await prisma.payment.count({
        where: {
          organizationId,
          status: 'PENDING'
        }
      });

      // Get recent transactions
      const recentTransactions = await prisma.payment.findMany({
        where: {
          organizationId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true
        }
      });

      const subs = await prisma.subscription.groupBy({
        by: ['status'],
        where: {
          customer: { organizationId }
        },
        _count: true
      });

      const subscriptionMetrics = {
        totalSubscriptions: subs.reduce((sum, s) => sum + s._count, 0),
        activeSubscriptions: subs.find(s => s.status === 'ACTIVE')?._count || 0,
        cancelledSubscriptions: subs.find(s => s.status === 'CANCELLED')?._count || 0,
        trialSubscriptions: subs.find(s => s.status === 'TRIAL')?._count || 0
      };

      // Get revenue metrics
      const yearlyRevenue = await prisma.payment.aggregate({
        where: {
          organizationId,
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1)
          }
        },
        _sum: {
          amount: true
        }
      });

      const orderCount = await prisma.order.count({
        where: {
          organizationId,
          status: 'DELIVERED'
        }
      });

      const averageOrderValue = orderCount > 0
        ? (totalRevenue._sum.amount?.toNumber() || 0) / orderCount
        : 0;

      return {
        totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
        monthlyRevenue: monthlyRevenue._sum.amount?.toNumber() || 0,
        activeSubscriptions,
        pendingPayments,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          amount: tx.amount.toNumber(),
          status: tx.status,
          createdAt: tx.createdAt
        })),
        subscriptionMetrics,
        revenueMetrics: {
          totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
          monthlyRevenue: monthlyRevenue._sum.amount?.toNumber() || 0,
          yearlyRevenue: yearlyRevenue._sum.amount?.toNumber() || 0,
          averageOrderValue
        }
      };
    } catch (error) {
      logger.error({
        message: 'Error fetching billing dashboard',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'BillingService', operation: 'getBillingDashboard', organizationId }
      });
      throw error;
    }
  }
}

export const billingService = new BillingService();


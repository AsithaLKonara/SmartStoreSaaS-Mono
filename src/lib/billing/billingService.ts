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
          status: 'COMPLETED'
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
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      });

      // Get active subscriptions (using Organization as proxy for now)
      let activeSubscriptions = 0;
      try {
        activeSubscriptions = await prisma.pWASubscription.count({
          where: {
            organizationId,
            isActive: true
          }
        });
      } catch (error) {
        // Table doesn't exist yet, use organization count as proxy
        activeSubscriptions = await prisma.organization.count({
          where: { id: organizationId }
        });
      }

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

      // Get subscription metrics (using Organization as proxy for now)
      let subscriptionMetrics = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        trialSubscriptions: 0
      };
      
      try {
        subscriptionMetrics = {
          totalSubscriptions: await prisma.pWASubscription.count({
            where: { organizationId }
          }),
          activeSubscriptions: await prisma.pWASubscription.count({
            where: { organizationId, isActive: true }
          }),
          cancelledSubscriptions: await prisma.pWASubscription.count({
            where: { organizationId, isActive: false }
          }),
          trialSubscriptions: 0 // No trial concept in PWA subscriptions
        };
      } catch (error) {
        // Table doesn't exist yet, use organization count as proxy
        const orgCount = await prisma.organization.count({
          where: { id: organizationId }
        });
        subscriptionMetrics = {
          totalSubscriptions: orgCount,
          activeSubscriptions: orgCount,
          cancelledSubscriptions: 0,
          trialSubscriptions: 0
        };
      }

      // Get revenue metrics
      const yearlyRevenue = await prisma.payment.aggregate({
        where: {
          organizationId,
          status: 'COMPLETED',
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
          status: 'COMPLETED'
        }
      });

      const averageOrderValue = orderCount > 0 
        ? (totalRevenue._sum.amount || 0) / orderCount 
        : 0;

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        activeSubscriptions,
        pendingPayments,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          status: tx.status,
          createdAt: tx.createdAt
        })),
        subscriptionMetrics,
        revenueMetrics: {
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          yearlyRevenue: yearlyRevenue._sum.amount || 0,
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


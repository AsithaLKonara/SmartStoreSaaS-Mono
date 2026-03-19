/**
 * Analytics API Route
 * Provides data for the main Analytics Dashboard page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

export const GET = requirePermission(Permission.ANALYTICS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const range = searchParams.get('range') || '30';
      const days = parseInt(range);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 1. Fetch Data
      const [
        totalRevenueData,
        totalOrders,
        totalCustomers,
        activeProducts,
        salesByDayRaw,
        topProductsRaw,
        topCustomersRaw,
        paymentMethodsRaw
      ] = await Promise.all([
        // Revenue from Delivered orders in period
        prisma.order.aggregate({
          where: { organizationId, status: 'DELIVERED', createdAt: { gte: startDate } },
          _sum: { total: true }
        }),
        // Orders count in period
        prisma.order.count({
          where: { organizationId, createdAt: { gte: startDate } }
        }),
        // Customers count in period
        prisma.customer.count({
          where: { organizationId, createdAt: { gte: startDate } }
        }),
        // Active Products total
        prisma.product.count({
          where: { organizationId, isActive: true }
        }),
        // Sales By Day
        prisma.order.groupBy({
          by: ['createdAt'],
          where: { organizationId, status: 'DELIVERED', createdAt: { gte: startDate } },
          _sum: { total: true },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),
        // Top Products
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: { organizationId, status: 'DELIVERED', createdAt: { gte: startDate } } },
          _sum: { total: true, quantity: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 5
        }),
        // Top Customers
        prisma.order.groupBy({
          by: ['customerId'],
          where: { organizationId, status: 'DELIVERED', createdAt: { gte: startDate } },
          _sum: { total: true },
          _count: { id: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 5
        }),
        // Payment Methods (from Payment model)
        prisma.payment.groupBy({
          by: ['method'],
          where: { organizationId, status: 'PAID', createdAt: { gte: startDate } },
          _sum: { amount: true },
          _count: { id: true }
        })
      ]);

      const totalRevenue = Number(totalRevenueData._sum.total || 0);

      // 2. Fetch missing names for top products/customers in batch
      const productIds = topProductsRaw.map(p => p.productId);
      const customerIds = topCustomersRaw.map(c => c.customerId);

      const [products, customers] = await Promise.all([
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true }
        }),
        prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true }
        })
      ]);

      const productMap = new Map(products.map(p => [p.id, p.name]));
      const customerMap = new Map(customers.map(c => [c.id, c.name]));

      // 3. Post-process data
      const analytics = {
        revenue: {
          total: totalRevenue,
          change: 12.5, 
          trend: 'up'
        },
        orders: {
          total: totalOrders,
          change: 8.2,
          trend: 'up'
        },
        customers: {
          total: totalCustomers,
          change: 5.4,
          trend: 'up'
        },
        products: {
          total: activeProducts,
          change: 2.1,
          trend: 'up'
        },
        salesByDay: salesByDayRaw.map(day => ({
          date: day.createdAt.toISOString().split('T')[0],
          revenue: Number(day._sum.total || 0),
          orders: day._count.id
        })),
        topProducts: topProductsRaw.map(p => ({
          name: productMap.get(p.productId) || 'Unknown Product',
          revenue: Number(p._sum.total || 0),
          orders: p._sum.quantity || 0
        })),
        topCustomers: topCustomersRaw.map(c => ({
          name: customerMap.get(c.customerId) || 'Unknown Customer',
          revenue: Number(c._sum.total || 0),
          orders: c._count.id
        })),
        paymentMethods: paymentMethodsRaw.map(p => ({
          method: p.method || 'Unknown',
          amount: Number(p._sum.amount || 0),
          percentage: totalRevenue > 0 ? (Number(p._sum.amount || 0) / totalRevenue) * 100 : 0
        }))
      };

      logger.info({
        message: 'Analytics data fetched successfully',
        context: { userId: user.id, organizationId, range, revenue: totalRevenue, orders: totalOrders },
        correlation: req.correlationId
      });

      return NextResponse.json(analytics);
    } catch (error: any) {
      logger.error({
        message: 'Analytics API error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { path: req.nextUrl.pathname, userId: user.id },
        correlation: req.correlationId
      });
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch analytics'
      }, { status: 500 });
    }
  }
);

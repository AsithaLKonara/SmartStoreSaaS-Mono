/**
 * Advanced Analytics Service
 */

import { prisma } from '@/lib/prisma';

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
}

export interface AnalyticsMetrics {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  conversionRate: number;
  growth: {
    revenue: number;
    orders: number;
    customers: number;
  };
}

/**
 * Get comprehensive analytics
 */
export async function getAdvancedAnalytics(
  organizationId: string,
  period: AnalyticsPeriod
): Promise<AnalyticsMetrics> {
  const { start, end } = period;

  const [currentOrders, previousOrders, customers, previousCustomers] = await Promise.all([
    prisma.order.aggregate({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
          lt: start,
        },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.customer.count({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.customer.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
          lt: start,
        },
      },
    }),
  ]);

  const currentRevenue = Number(currentOrders._sum.total || 0);
  const previousRevenue = Number(previousOrders._sum.total || 0);
  const currentOrderCount = currentOrders._count;
  const previousOrderCount = previousOrders._count;

  return {
    revenue: currentRevenue,
    orders: currentOrderCount,
    customers,
    avgOrderValue: currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0,
    conversionRate: 0, // Would need visitor tracking
    growth: {
      revenue: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      orders: previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0,
      customers: previousCustomers > 0 ? ((customers - previousCustomers) / previousCustomers) * 100 : 0,
    },
  };
}

/**
 * Get product performance analytics
 */
export async function getProductPerformance(
  organizationId: string,
  period: AnalyticsPeriod,
  limit: number = 10
) {
  const { start, end } = period;

  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
    },
    _sum: {
      quantity: true,
      total: true,
    },
    _count: {
      productId: true,
    },
    orderBy: {
      _sum: {
        total: 'desc',
      },
    },
    take: limit,
  });

  // Optimization: Fetch all products in one query to avoid N+1
  const productIds = topProducts.map(tp => tp.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, price: true },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  return topProducts.map((item) => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      name: product?.name || 'Unknown',
      sku: product?.sku || '',
      quantitySold: item._sum.quantity || 0,
      revenue: Number(item._sum.total || 0),
      orders: item._count.productId,
    };
  });
}

/**
 * Get customer analytics
 */
export async function getCustomerAnalytics(
  organizationId: string,
  period: AnalyticsPeriod
) {
  const { start, end } = period;

  // Optimized to use aggregations where possible
  const customerStats = await prisma.customer.findMany({
    where: {
      organizationId,
      orders: {
        some: {
          createdAt: { gte: start, lte: end },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      orders: {
        where: { createdAt: { gte: start, lte: end } },
        select: { total: true }
      }
    },
  });

  const customerMetrics = customerStats.map(customer => {
    const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.total), 0);
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      orders: customer.orders.length,
      totalSpent,
      avgOrderValue: customer.orders.length > 0 ? totalSpent / customer.orders.length : 0,
    };
  });

  customerMetrics.sort((a, b) => b.totalSpent - a.totalSpent);

  return {
    topCustomers: customerMetrics.slice(0, 10),
    totalCustomers: customerMetrics.length,
    avgLifetimeValue: customerMetrics.length > 0
      ? customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0) / customerMetrics.length
      : 0,
  };
}

/**
 * Get sales trends (daily/weekly/monthly)
 */
export async function getSalesTrends(
  organizationId: string,
  period: AnalyticsPeriod,
  interval: 'day' | 'week' | 'month' = 'day'
) {
  const { start, end } = period;

  // Ideally we would use database-level date truncation, 
  // but for universal support with Prisma across DBs, we'll fetch only what's needed
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const trends: Record<string, { date: string; revenue: number; orders: number }> = {};

  for (const order of orders) {
    let key: string;
    const date = new Date(order.createdAt);
    
    if (interval === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (interval === 'week') {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      key = d.toISOString().split('T')[0];
    } else {
      key = date.toISOString().substring(0, 7);
    }

    if (!trends[key]) {
      trends[key] = { date: key, revenue: 0, orders: 0 };
    }

    trends[key].revenue += Number(order.total);
    trends[key].orders++;
  }

  return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date));
}


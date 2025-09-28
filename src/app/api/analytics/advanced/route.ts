import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get advanced analytics dashboard
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d';
        const metrics = searchParams.get('metrics')?.split(',') || ['all'];

        const analytics = await generateAdvancedAnalytics(user.organizationId, period, metrics);

        return NextResponse.json(analytics);

      case 'POST':
        // Generate custom analytics report
        const { reportType, dateRange, filters, groupBy, metrics: requestedMetrics } = await request.json();

        if (!reportType) {
          return NextResponse.json(
            { error: 'Missing required field: reportType' },
            { status: 400 }
          );
        }

        const customReport = await generateCustomReport(
          user.organizationId,
          reportType,
          dateRange,
          filters,
          groupBy,
          requestedMetrics
        );

        // Save report
        const savedReport = await prisma.report.create({
          data: {
            organizationId: user.organizationId,
            name: `${reportType} Report - ${new Date().toLocaleDateString()}`,
            type: reportType,
            data: JSON.stringify(customReport),
            filters: filters ? JSON.stringify(filters) : null,
            generatedBy: user.id,
          },
        });

        return NextResponse.json({
          report: {
            ...savedReport,
            data: customReport,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Advanced Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAdvancedAnalytics(organizationId: string, period: string, metrics: string[]) {
  try {
    const dateRange = getDateRange(period);
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    const analytics: any = {
      period,
      dateRange: { start: startDate, end: endDate },
      generatedAt: new Date(),
    };

    // Revenue Analytics
    if (metrics.includes('all') || metrics.includes('revenue')) {
      analytics.revenue = await getRevenueAnalytics(organizationId, startDate, endDate);
    }

    // Customer Analytics
    if (metrics.includes('all') || metrics.includes('customers')) {
      analytics.customers = await getCustomerAnalytics(organizationId, startDate, endDate);
    }

    // Product Performance
    if (metrics.includes('all') || metrics.includes('products')) {
      analytics.products = await getProductAnalytics(organizationId, startDate, endDate);
    }

    // Order Analytics
    if (metrics.includes('all') || metrics.includes('orders')) {
      analytics.orders = await getOrderAnalytics(organizationId, startDate, endDate);
    }

    // Inventory Analytics
    if (metrics.includes('all') || metrics.includes('inventory')) {
      analytics.inventory = await getInventoryAnalytics(organizationId);
    }

    // Conversion Funnel
    if (metrics.includes('all') || metrics.includes('conversion')) {
      analytics.conversion = await getConversionAnalytics(organizationId, startDate, endDate);
    }

    // Geographic Analytics
    if (metrics.includes('all') || metrics.includes('geographic')) {
      analytics.geographic = await getGeographicAnalytics(organizationId, startDate, endDate);
    }

    // Time-based Trends
    if (metrics.includes('all') || metrics.includes('trends')) {
      analytics.trends = await getTrendAnalytics(organizationId, startDate, endDate, period);
    }

    return analytics;
  } catch (error) {
    console.error('Error generating advanced analytics:', error);
    throw error;
  }
}

async function generateCustomReport(
  organizationId: string,
  reportType: string,
  dateRange: any,
  filters: any,
  groupBy: string,
  metrics: string[]
) {
  try {
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    let report: any = {
      reportType,
      dateRange: { start: startDate, end: endDate },
      filters,
      groupBy,
      metrics,
      generatedAt: new Date(),
    };

    switch (reportType) {
      case 'sales':
        report.data = await getSalesReport(organizationId, startDate, endDate, groupBy, filters);
        break;
      case 'customers':
        report.data = await getCustomerReport(organizationId, startDate, endDate, groupBy, filters);
        break;
      case 'products':
        report.data = await getProductReport(organizationId, startDate, endDate, groupBy, filters);
        break;
      case 'inventory':
        report.data = await getInventoryReport(organizationId, filters);
        break;
      case 'financial':
        report.data = await getFinancialReport(organizationId, startDate, endDate, groupBy, filters);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    return report;
  } catch (error) {
    console.error('Error generating custom report:', error);
    throw error;
  }
}

// Helper functions for different analytics
function getDateRange(period: string) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start: startDate, end: now };
}

async function getRevenueAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const revenueData = await prisma.order.aggregate({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { total: true },
    _count: true,
  });

  const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
  const previousRevenue = await prisma.order.aggregate({
    where: {
      organizationId,
      createdAt: { gte: previousPeriodStart, lt: startDate },
    },
    _sum: { total: true },
  });

  const currentRevenue = revenueData._sum.total || 0;
  const previousRevenueAmount = previousRevenue._sum.total || 0;
  const growthRate = previousRevenueAmount > 0 ? ((currentRevenue - previousRevenueAmount) / previousRevenueAmount) * 100 : 0;

  return {
    totalRevenue: currentRevenue,
    orderCount: revenueData._count || 0,
    averageOrderValue: revenueData._count > 0 ? currentRevenue / revenueData._count : 0,
    growthRate,
    previousRevenue: previousRevenueAmount,
  };
}

async function getCustomerAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const newCustomers = await prisma.customer.count({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const totalCustomers = await prisma.customer.count({
    where: { organizationId },
  });

  const returningCustomers = await prisma.customer.count({
    where: {
      organizationId,
      createdAt: { lt: startDate },
      orders: {
        some: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  return {
    newCustomers,
    totalCustomers,
    returningCustomers,
    customerRetentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
  };
}

async function getProductAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
    },
    _sum: { quantity: true, total: true },
    _count: true,
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });

  const lowStockProducts = await prisma.product.count({
    where: {
      organizationId,
      stock: { lte: prisma.product.fields.minStock },
    },
  });

  return {
    topProducts: topProducts.map(item => ({
      productId: item.productId,
      quantitySold: item._sum.quantity || 0,
      revenue: item._sum.total || 0,
      orderCount: item._count || 0,
    })),
    lowStockProducts,
  };
}

async function getOrderAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const orderStatusData = await prisma.order.groupBy({
    by: ['status'],
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
    _sum: { total: true },
  });

  const averageProcessingTime = await prisma.$queryRaw`
    SELECT AVG(julianday(updatedAt) - julianday(createdAt)) as avgDays
    FROM "Order"
    WHERE organizationId = ${organizationId}
      AND createdAt >= ${startDate}
      AND createdAt <= ${endDate}
      AND status = 'COMPLETED'
  `;

  return {
    statusDistribution: orderStatusData,
    averageProcessingTime: averageProcessingTime[0]?.avgDays || 0,
  };
}

async function getInventoryAnalytics(organizationId: string) {
  const totalProducts = await prisma.product.count({
    where: { organizationId },
  });

  const lowStockProducts = await prisma.product.count({
    where: {
      organizationId,
      stock: { lte: prisma.product.fields.minStock },
    },
  });

  const outOfStockProducts = await prisma.product.count({
    where: {
      organizationId,
      stock: 0,
    },
  });

  const totalInventoryValue = await prisma.product.aggregate({
    where: { organizationId },
    _sum: { cost: true },
  });

  return {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalInventoryValue: totalInventoryValue._sum.cost || 0,
    stockHealth: totalProducts > 0 ? ((totalProducts - lowStockProducts - outOfStockProducts) / totalProducts) * 100 : 100,
  };
}

async function getConversionAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  // This is a simplified conversion funnel
  const visitors = await prisma.analytics.count({
    where: {
      organizationId,
      type: 'PAGE_VIEW',
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const cartAdditions = await prisma.analytics.count({
    where: {
      organizationId,
      type: 'CART_ADD',
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const orders = await prisma.order.count({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  return {
    visitors,
    cartAdditions,
    orders,
    conversionRate: visitors > 0 ? (orders / visitors) * 100 : 0,
    cartConversionRate: cartAdditions > 0 ? (orders / cartAdditions) * 100 : 0,
  };
}

async function getGeographicAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  // This would require customer address data
  // For now, return placeholder data
  return {
    topCities: [],
    topCountries: [],
    distribution: {},
  };
}

async function getTrendAnalytics(organizationId: string, startDate: Date, endDate: Date, period: string) {
  const groupBy = period === '7d' ? 'day' : 'week';
  
  const salesTrend = await prisma.$queryRaw`
    SELECT 
      ${groupBy === 'day' ? 'DATE(createdAt) as date' : 'strftime("%Y-%W", createdAt) as week'},
      COUNT(*) as orderCount,
      SUM(total) as totalSales
    FROM "Order"
    WHERE organizationId = ${organizationId}
      AND createdAt >= ${startDate}
      AND createdAt <= ${endDate}
    GROUP BY ${groupBy === 'day' ? 'DATE(createdAt)' : 'strftime("%Y-%W", createdAt)'}
    ORDER BY ${groupBy === 'day' ? 'date' : 'week'}
  `;

  return {
    salesTrend,
    groupBy,
  };
}

// Report generation functions
async function getSalesReport(organizationId: string, startDate: Date, endDate: Date, groupBy: string, filters: any) {
  // Implementation for sales report
  return { message: 'Sales report data' };
}

async function getCustomerReport(organizationId: string, startDate: Date, endDate: Date, groupBy: string, filters: any) {
  // Implementation for customer report
  return { message: 'Customer report data' };
}

async function getProductReport(organizationId: string, startDate: Date, endDate: Date, groupBy: string, filters: any) {
  // Implementation for product report
  return { message: 'Product report data' };
}

async function getInventoryReport(organizationId: string, filters: any) {
  // Implementation for inventory report
  return { message: 'Inventory report data' };
}

async function getFinancialReport(organizationId: string, startDate: Date, endDate: Date, groupBy: string, filters: any) {
  // Implementation for financial report
  return { message: 'Financial report data' };
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

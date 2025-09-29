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

        return NextResponse.json({
          success: true,
          data: customReport,
          message: 'Custom report generated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Advanced analytics API error:', error);
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

    return analytics;
  } catch (error) {
    console.error('Error generating advanced analytics:', error);
    throw error;
  }
}

async function generateCustomReport(organizationId: string, reportType: string, dateRange: any, filters: any, groupBy: any, metrics: any) {
  // Simplified custom report generation
  return {
    reportType,
    dateRange,
    filters,
    groupBy,
    metrics,
    data: {
      summary: 'Custom report generated successfully',
      timestamp: new Date().toISOString()
    }
  };
}

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
  const revenue = await prisma.order.aggregate({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ['CANCELLED', 'RETURNED'] }
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  return {
    total: revenue._sum.totalAmount || 0,
    orders: revenue._count.id || 0,
    average: revenue._count.id > 0 ? (revenue._sum.totalAmount || 0) / revenue._count.id : 0
  };
}

async function getCustomerAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const customers = await prisma.customer.aggregate({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { id: true }
  });

  return {
    newCustomers: customers._count.id || 0
  };
}

async function getProductAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const products = await prisma.product.count({
    where: {
      organizationId,
      isActive: true
    }
  });

  return {
    totalProducts: products,
    activeProducts: products
  };
}

async function getOrderAnalytics(organizationId: string, startDate: Date, endDate: Date) {
  const orders = await prisma.order.aggregate({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate }
    },
    _count: { id: true }
  });

  return {
    totalOrders: orders._count.id || 0
  };
}

export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});
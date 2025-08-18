import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';
import { z } from 'zod';

// Report generation schema
const generateReportSchema = z.object({
  type: z.enum(['SALES', 'INVENTORY', 'CUSTOMER', 'PRODUCT', 'FINANCIAL', 'CUSTOM']),
  dateRange: z.object({
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date')
  }),
  filters: z.record(z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  format: z.enum(['JSON', 'CSV', 'PDF']).default('JSON'),
  includeCharts: z.boolean().default(true)
});

// GET /api/reports - List available reports and generated reports
async function getReports(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      organizationId: request.user!.organizationId
    };
    
    if (type) where.type = type;
    if (status) where.status = status;

    // Reports functionality disabled - model doesn't exist in schema
    const total = 0;
    
    // Reports functionality disabled - model doesn't exist in schema
    const reports: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate new report
async function generateReport(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = generateReportSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const reportData = validationResult.data;

    // Validate date range
    if (new Date(reportData.dateRange.startDate) >= new Date(reportData.dateRange.endDate)) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create report record
    const report = await prisma.report.create({
      data: {
        name: `${reportData.type} Report - ${new Date().toLocaleDateString()}`,
        type: reportData.type,

        config: {
          dateRange: reportData.dateRange,
          filters: reportData.filters,
          groupBy: reportData.groupBy,
          format: reportData.format,
          includeCharts: reportData.includeCharts
        },
        organizationId: request.user!.organizationId,
        createdById: request.user!.userId
      }
    });



    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'REPORT_GENERATED',
        description: `Report "${reportData.type}" generation started`,
        userId: request.user!.userId,
        metadata: {
          reportId: report.id,
          reportType: reportData.type,
          dateRange: reportData.dateRange,
          format: reportData.format
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { report },
      message: 'Report generation started successfully'
    }, { status: 202 });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    );
  }
}



// Generate sales report
async function generateSalesReport(startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    createdAt: { gte: startDate, lte: endDate },
    status: { notIn: ['CANCELLED', 'RETURNED'] }
  };

  if (filters?.status) where.status = filters.status;
  if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { name: true, sku: true } } } }
    }
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily sales trend
  const dailySales = await prisma.order.groupBy({
    by: ['createdAt'],
    where,
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  return {
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      period: { startDate, endDate }
    },
    dailyTrend: dailySales.map(day => ({
      date: day.createdAt,
      revenue: day._sum.totalAmount || 0,
      orders: day._count.id || 0
    })),
    topProducts: await getTopSellingProducts(where),
    topCustomers: await getTopCustomers(where)
  };
}

// Generate inventory report
async function generateInventoryReport(startDate: Date, endDate: Date, filters: any) {
  const products = await prisma.product.findMany({
    where: { organizationId: filters?.organizationId },
    include: {
      
    }
  });

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stockQuantity <= 10);
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0);

  return {
    summary: {
      totalProducts,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length
    },
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      status: p.stockQuantity === 0 ? 'OUT_OF_STOCK' : 
              p.stockQuantity <= 10 ? 'LOW_STOCK' : 'IN_STOCK'
    }))
  };
}

// Generate customer report
async function generateCustomerReport(startDate: Date, endDate: Date, filters: any) {
  const customers = await prisma.customer.findMany({
    where: { 
      organizationId: filters?.organizationId,
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      orders: {
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { totalAmount: true, createdAt: true }
      }
    }
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.orders.length > 0);
  const newCustomers = customers.filter(c => c.createdAt >= startDate);

  return {
    summary: {
      totalCustomers,
      activeCustomers: activeCustomers.length,
      newCustomers: newCustomers.length,
      retentionRate: totalCustomers > 0 ? (activeCustomers.length / totalCustomers) * 100 : 0
    },
    customers: customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      orderCount: c.orders.length,
      totalSpent: c.orders.reduce((sum, order) => sum + order.totalAmount, 0)
    }))
  };
}

// Generate product report
async function generateProductReport(startDate: Date, endDate: Date, filters: any) {
  const products = await prisma.product.findMany({
    where: { organizationId: filters?.organizationId },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { notIn: ['CANCELLED', 'RETURNED'] }
          }
        },
        select: { quantity: true, total: true }
      }
    }
  });

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.orderItems.length > 0);

  return {
    summary: {
      totalProducts,
      activeProducts: activeProducts.length,
      inactiveProducts: totalProducts - activeProducts.length
    },
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitsSold: p.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue: p.orderItems.reduce((sum, item) => sum + item.total, 0)
    }))
  };
}

// Generate financial report
async function generateFinancialReport(startDate: Date, endDate: Date, filters: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ['CANCELLED', 'RETURNED'] }
    }
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalTax = orders.reduce((sum, order) => sum + (order.tax || 0), 0);
  const totalShipping = orders.reduce((sum, order) => sum + (order.shipping || 0), 0);

  return {
    summary: {
      totalRevenue,
      totalTax,
      totalShipping,
      netRevenue: totalRevenue - totalTax - totalShipping
    },
    monthlyBreakdown: await getMonthlyFinancialBreakdown(startDate, endDate)
  };
}

// Helper functions for report generation
async function getTopSellingProducts(where: any) {
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: where },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10
  });

  return await Promise.all(topProducts.map(async (item) => {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { name: true, sku: true }
    });
    
    return {
      productId: item.productId,
      productName: product?.name || 'Unknown',
      sku: product?.sku || 'Unknown',
      unitsSold: item._sum.quantity || 0,
      revenue: item._sum.total || 0
    };
  }));
}

async function getTopCustomers(where: any) {
  const topCustomers = await prisma.order.groupBy({
    by: ['customerId'],
    where,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10
  });

  return await Promise.all(topCustomers.map(async (item) => {
    const customer = await prisma.customer.findUnique({
      where: { id: item.customerId },
      select: { name: true, email: true }
    });
    
    return {
      customerId: item.customerId,
      customerName: customer?.name || 'Unknown',
      email: customer?.email || 'Unknown',
      totalSpent: item._sum.totalAmount || 0,
      orderCount: item._count.id || 0
    };
  }));
}

async function getMonthlyFinancialBreakdown(startDate: Date, endDate: Date) {
  const monthlyData = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ['CANCELLED', 'RETURNED'] }
    },
    _sum: { totalAmount: true, tax: true, shipping: true }
  });

  return monthlyData.map(month => ({
    month: month.createdAt,
    revenue: month._sum.totalAmount || 0,
    tax: month._sum.tax || 0,
    shipping: month._sum.shipping || 0
  }));
}

// Chart generation functions
function generateSalesCharts(data: any) {
  return [
    {
      type: 'line',
      title: 'Daily Sales Trend',
      data: data.dailyTrend,
      xAxis: 'date',
      yAxis: 'revenue'
    },
    {
      type: 'bar',
      title: 'Top Products',
      data: data.topProducts,
      xAxis: 'productName',
      yAxis: 'revenue'
    }
  ];
}

function generateInventoryCharts(data: any) {
  return [
    {
      type: 'pie',
      title: 'Stock Status Distribution',
      data: [
        { label: 'In Stock', value: data.summary.totalProducts - data.summary.lowStockProducts - data.summary.outOfStockProducts },
        { label: 'Low Stock', value: data.summary.lowStockProducts },
        { label: 'Out of Stock', value: data.summary.outOfStockProducts }
      ]
    }
  ];
}

function generateCustomerCharts(data: any) {
  return [
    {
      type: 'bar',
      title: 'Top Customers by Revenue',
      data: data.topCustomers,
      xAxis: 'customerName',
      yAxis: 'totalSpent'
    }
  ];
}

function generateProductCharts(data: any) {
  return [
    {
      type: 'bar',
      title: 'Top Products by Units Sold',
      data: data.products,
      xAxis: 'name',
      yAxis: 'unitsSold'
    }
  ];
}

function generateFinancialCharts(data: any) {
  return [
    {
      type: 'line',
      title: 'Monthly Revenue Trend',
      data: data.monthlyBreakdown,
      xAxis: 'month',
      yAxis: 'revenue'
    }
  ];
}

// Export handlers
export const GET = withProtection()(getReports);
export const POST = withProtection(['ADMIN', 'MANAGER'])(generateReport); 
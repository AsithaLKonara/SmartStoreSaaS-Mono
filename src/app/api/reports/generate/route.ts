import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportType,
      organizationId,
      startDate,
      endDate,
      format = 'json',
    } = body;

    if (!reportType || !organizationId) {
      return NextResponse.json(
        { error: 'Report type and organization ID are required' },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData: any = {};

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(organizationId, start, end);
        break;

      case 'inventory':
        reportData = await generateInventoryReport(organizationId);
        break;

      case 'customers':
        reportData = await generateCustomerReport(organizationId, start, end);
        break;

      case 'financial':
        reportData = await generateFinancialReport(organizationId, start, end);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      reportType,
      period: { start, end },
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Report generation failed',
      },
      { status: 500 }
    );
  }
}

async function generateSalesReport(organizationId: string, start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end },
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      },
    },
  });

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return {
    summary: {
      totalSales,
      totalOrders,
      avgOrderValue,
      period: { start, end },
    },
    orders,
  };
}

async function generateInventoryReport(organizationId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minStock: true,
      price: true,
      cost: true,
    },
  });

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const outOfStock = products.filter(p => p.stock === 0);
  const totalValue = products.reduce((sum, p) => sum + (p.stock * Number(p.cost || 0)), 0);

  return {
    summary: {
      totalProducts: products.length,
      lowStockItems: lowStock.length,
      outOfStockItems: outOfStock.length,
      totalInventoryValue: totalValue,
    },
    lowStock,
    outOfStock,
    allProducts: products,
  };
}

async function generateCustomerReport(organizationId: string, start: Date, end: Date) {
  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end },
    },
    include: {
      orders: true,
    },
  });

  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter(c => c.orders.length > 0).length;

  return {
    summary: {
      totalCustomers,
      newCustomers: totalCustomers,
      customersWithOrders,
      conversionRate: totalCustomers > 0 ? (customersWithOrders / totalCustomers) * 100 : 0,
    },
    customers: customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalOrders: c.orders.length,
      totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
    })),
  };
}

async function generateFinancialReport(organizationId: string, start: Date, end: Date) {
  const orders = await prisma.order.aggregate({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end },
    },
    _sum: {
      total: true,
      subtotal: true,
      tax: true,
      shipping: true,
      discount: true,
    },
    _count: true,
  });

  const payments = await prisma.payment.aggregate({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  return {
    summary: {
      revenue: Number(orders._sum.total || 0),
      subtotal: Number(orders._sum.subtotal || 0),
      tax: Number(orders._sum.tax || 0),
      shipping: Number(orders._sum.shipping || 0),
      discounts: Number(orders._sum.discount || 0),
      totalOrders: orders._count,
      paymentsReceived: Number(payments._sum.amount || 0),
      paymentsCount: payments._count,
    },
  };
}


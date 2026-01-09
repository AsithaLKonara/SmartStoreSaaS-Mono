/**
 * Reports Generation API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_REPORTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function generateSalesReport(organizationId: string, start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' }
    },
    include: {
      customer: true,
      orderItems: {
        include: { product: true }
      }
    }
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;

  return {
    reportType: 'sales',
    period: { start, end },
    summary: { totalRevenue, totalOrders },
    orders
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
      cost: true
    }
  });

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + (Number(p.cost || p.price) * p.stock), 0);

  return {
    reportType: 'inventory',
    summary: {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      totalValue
    },
    products,
    lowStock
  };
}

async function generateCustomerReport(organizationId: string, start: Date, end: Date) {
  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end }
    }
  });

  return {
    reportType: 'customers',
    period: { start, end },
    summary: {
      totalCustomers: customers.length,
      newCustomers: customers.length
    },
    customers
  };
}

async function generateFinancialReport(organizationId: string, start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      createdAt: { gte: start, lte: end }
    }
  });

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const tax = orders.reduce((sum, o) => sum + Number(o.tax), 0);

  return {
    reportType: 'financial',
    period: { start, end },
    summary: { revenue, tax, net: revenue - tax },
    orders
  };
}

import { AuthenticatedRequest } from '@/lib/middleware/auth';

export const POST = requirePermission('VIEW_REPORTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { reportType, startDate, endDate, format = 'json' } = body;

      if (!reportType) {
        throw new ValidationError('Report type is required', {
          fields: { reportType: !reportType }
        });
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
          throw new ValidationError('Invalid report type');
      }

      logger.info({
        message: 'Report generated',
        context: {
          userId: user.id,
          organizationId,
          reportType
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        ...reportData,
        generatedAt: new Date().toISOString(),
        generatedBy: user.id
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to generate report',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to generate report',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * Sales Reports API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_REPORTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/sales
 * Generate sales report
 */
export const POST = requirePermission(Permission.REPORTS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { startDate, endDate, groupBy = 'day' } = body;

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      // Fetch sales (orders)
      const sales = await prisma.order.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: start,
            lte: end
          },
          status: { not: 'CANCELLED' } // Exclude cancelled orders
        },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          orderItems: {
            select: {
              quantity: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate totals
      const totalRevenue = sales.reduce((sum, order) => sum + Number(order.total), 0);
      const totalOrders = sales.length;
      const totalItemsSold = sales.reduce((sum, order) => sum + order.orderItems.reduce((acc, item) => acc + item.quantity, 0), 0);

      // Group by date (simplified)
      const groupedData: Record<string, { revenue: number, orders: number }> = {};

      sales.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0] as string; // YYYY-MM-DD
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = { revenue: 0, orders: 0 };
        }
        groupedData[dateKey].revenue += Number(order.total);
        groupedData[dateKey].orders += 1;
      });

      const timeSeriesData = Object.entries(groupedData).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      }));

      logger.info({
        message: 'Sales report generated',
        context: {
          userId: user.id,
          organizationId,
          count: sales.length,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        reportType: 'sales_summary',
        period: { start, end },
        summary: {
          totalRevenue,
          totalOrders,
          totalItemsSold,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        data: timeSeriesData
      }));
    } catch (error: any) {
      logger.error({
        message: 'Sales report generation failed',
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
        message: 'Sales report generation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

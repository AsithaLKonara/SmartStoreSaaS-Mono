/**
 * Advanced Analytics API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (VIEW_ADVANCED_ANALYTICS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/advanced
 * Get advanced analytics
 */
export const POST = requirePermission('VIEW_ANALYTICS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { metrics = ['sales', 'growth'], timeRange = '30d' } = body;

      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(endDate.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(endDate.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(endDate.getDate() - 90);
      else startDate.setDate(endDate.getDate() - 30); // Default 30d

      const results: Record<string, any> = {};

      if (metrics.includes('sales')) {
        const sales = await prisma.order.groupBy({
          by: ['createdAt'],
          where: {
            organizationId,
            createdAt: { gte: startDate, lte: endDate },
            status: 'DELIVERED'
          },
          _sum: { total: true },
        });

        // Simplify for daily view (Prisma groupBy date is tricky due to timestamp, doing in JS for now as workaround)
        const salesByDate = await prisma.order.findMany({
          where: {
            organizationId,
            createdAt: { gte: startDate, lte: endDate },
            status: 'DELIVERED'
          },
          select: { createdAt: true, total: true }
        });

        const dailySales: Record<string, number> = {};
        salesByDate.forEach(s => {
          const day = s.createdAt.toISOString().split('T')[0];
          if (day) {
            dailySales[day as string] = (dailySales[day as string] || 0) + Number(s.total);
          }
        });

        results.salesOverTime = Object.entries(dailySales).map(([date, amount]) => ({ date, amount }));
      }

      if (metrics.includes('customers')) {
        const newCustomers = await prisma.customer.count({
          where: {
            organizationId,
            createdAt: { gte: startDate, lte: endDate }
          }
        });
        results.newCustomers = newCustomers;
      }

      if (metrics.includes('growth')) {
        // Compare with previous period
        const previousStart = new Date(startDate);
        previousStart.setDate(previousStart.getDate() - (endDate.getDate() - startDate.getDate()));

        const currentSales = await prisma.order.aggregate({
          _sum: { total: true },
          where: { organizationId, createdAt: { gte: startDate, lte: endDate }, status: 'DELIVERED' }
        });

        const previousSales = await prisma.order.aggregate({
          _sum: { total: true },
          where: { organizationId, createdAt: { gte: previousStart, lte: startDate }, status: 'DELIVERED' }
        });

        const current = Number(currentSales._sum.total || 0);
        const previous = Number(previousSales._sum.total || 0);
        const growth = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

        results.growth = {
          revenue: growth.toFixed(2) + '%',
          currentPeriod: current,
          previousPeriod: previous
        };
      }

      logger.info({
        message: 'Advanced analytics generated',
        context: {
          userId: user.id,
          organizationId,
          metrics,
          timeRange
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        data: results,
        period: { start: startDate, end: endDate },
        message: 'Advanced analytics generated'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Advanced analytics failed',
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
        message: 'Advanced analytics failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

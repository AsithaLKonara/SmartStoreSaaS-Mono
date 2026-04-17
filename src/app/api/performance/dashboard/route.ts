import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/dashboard
 * Performance dashboard data (MANAGER or higher)
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const timeRange = searchParams.get('timeRange') || '24h';
      const metric = searchParams.get('metric') || 'all';

      logger.info({
        message: 'Performance dashboard data requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          timeRange,
          metric
        },
        correlation: req.correlationId
      });

      const orgId = user.organizationId;
      const since = new Date();
      if (timeRange === '7d') since.setDate(since.getDate() - 7);
      else if (timeRange === '30d') since.setDate(since.getDate() - 30);
      else since.setHours(since.getHours() - 24);

      const [totalUsers, totalOrders, revenue, activeAlerts] = await Promise.all([
        prisma.user.count({ where: { organizationId: orgId } }),
        prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: since } } }),
        prisma.order.aggregate({
          where: { organizationId: orgId, createdAt: { gte: since } },
          _sum: { total: true },
          _avg: { total: true },
        }),
        prisma.productionAlert.findMany({
          where: { status: 'ACTIVE' as any },
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: { id: true, type: true, title: true, severity: true, timestamp: true, status: true },
        }),
      ]);

      // Build 30-day revenue trend
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const orderTrend = await prisma.order.findMany({
        where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const trendMap: Record<string, { orders: number; revenue: number }> = {};
      for (const o of orderTrend) {
        const day = o.createdAt.toISOString().split('T')[0];
        if (!trendMap[day]) trendMap[day] = { orders: 0, revenue: 0 };
        trendMap[day].orders += 1;
        trendMap[day].revenue += Number(o.total ?? 0);
      }
      const trends = Object.entries(trendMap).map(([date, v]) => ({ date, ...v }));

      // Real process/memory for performance section
      const mem = process.memoryUsage();

      const dashboardData = {
        overview: {
          totalUsers,
          totalOrders,
          totalRevenue: Number(revenue._sum.total ?? 0),
          averageOrderValue: Number(revenue._avg.total ?? 0),
        },
        performance: {
          heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
          uptime: Math.floor(process.uptime()),
        },
        trends,
        alerts: activeAlerts,
      };

      return NextResponse.json(successResponse(dashboardData));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch performance dashboard data',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch performance dashboard data',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
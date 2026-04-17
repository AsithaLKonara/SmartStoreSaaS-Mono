import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/metrics
 * Monitoring metrics (MANAGER or higher)
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const timeRange = searchParams.get('timeRange') || '24h';
      const metric = searchParams.get('metric') || 'all';

      logger.info({
        message: 'Monitoring metrics requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          timeRange,
          metric
        },
        correlation: req.correlationId
      });

      const orgId = user.organizationId;

      // Real process metrics
      const mem = process.memoryUsage();
      const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);

      // Real business metrics from DB
      const now = new Date();
      const since = new Date();
      if (timeRange === '24h') since.setHours(since.getHours() - 24);
      else if (timeRange === '7d') since.setDate(since.getDate() - 7);
      else if (timeRange === '30d') since.setDate(since.getDate() - 30);

      const [orders, revenue] = await Promise.all([
        prisma.order.count({
          where: { organizationId: orgId, createdAt: { gte: since } }
        }),
        prisma.order.aggregate({
          where: { organizationId: orgId, createdAt: { gte: since } },
          _sum: { total: true },
          _avg: { total: true },
        }),
      ]);

      const metrics = {
        system: {
          heapUsedMB,
          heapTotalMB,
          heapUsagePercent: Math.round((heapUsedMB / heapTotalMB) * 100),
          uptime: Math.floor(process.uptime()),
        },
        business: {
          totalOrders: orders,
          revenue: Number(revenue._sum.total ?? 0),
          averageOrderValue: Number(revenue._avg.total ?? 0),
        },
        timeRange,
      };

      return NextResponse.json(successResponse({
        metrics,
        timeRange,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch monitoring metrics',
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
        message: 'Failed to fetch monitoring metrics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
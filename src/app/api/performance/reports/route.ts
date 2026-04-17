/**
 * Performance Reports API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_PERFORMANCE_REPORTS permission)
 * 
 * System-wide: Performance analysis reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/reports
 * Get performance reports (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const timeRange = searchParams.get('timeRange') || '7d';

      const since = new Date();
      if (timeRange === '7d') since.setDate(since.getDate() - 7);
      else if (timeRange === '30d') since.setDate(since.getDate() - 30);
      else since.setHours(since.getHours() - 24);

      const [metrics, alerts, errorEvents] = await Promise.all([
        prisma.monitoringMetric.findMany({
          where: { timestamp: { gte: since } },
          orderBy: { timestamp: 'desc' },
          take: 100,
        }),
        prisma.productionAlert.findMany({
          where: { timestamp: { gte: since } },
          orderBy: { timestamp: 'desc' },
        }),
        prisma.errorEvent.count({
          where: { createdAt: { gte: since }, resolved: false },
        }),
      ]);

      const avgResponseTime = metrics
        .filter(m => m.name === 'response_time')
        .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);

      logger.info({
        message: 'Performance reports fetched',
        context: { userId: user.id, timeRange, metricsCount: metrics.length },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        reports: metrics,
        alerts,
        summary: {
          avgResponseTime: Math.round(avgResponseTime),
          totalMetrics: metrics.length,
          activeAlerts: alerts.filter(a => a.status === 'ACTIVE').length,
          unresolvedErrors: errorEvents,
        },
        timeRange,
      }));
    } catch (error: any) {
      logger.error({
        message: 'Performance reports failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Performance reports failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/status
 * System status check (MANAGER or higher)
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'System status check requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      // 1. Check DB connectivity with a raw ping
      const dbStart = Date.now();
      let dbStatus = 'healthy';
      let dbResponseTime = 0;
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbResponseTime = Date.now() - dbStart;
      } catch {
        dbStatus = 'unhealthy';
      }

      // 2. Check memory pressure
      const mem = process.memoryUsage();
      const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
      const memUsagePct = Math.round((heapUsedMB / heapTotalMB) * 100);

      const healthChecks = {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          lastChecked: new Date().toISOString()
        },
        memory: {
          status: memUsagePct < 90 ? 'healthy' : 'warning',
          heapUsedMB,
          heapTotalMB,
          usagePercent: memUsagePct,
          lastChecked: new Date().toISOString()
        },
        process: {
          status: 'healthy',
          uptime: Math.floor(process.uptime()),
          pid: process.pid,
          nodeVersion: process.version,
          lastChecked: new Date().toISOString()
        }
      };

      const overallStatus = Object.values(healthChecks).every(check =>
        check.status === 'healthy'
      ) ? 'healthy' : 'degraded';

      const systemStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: healthChecks
      };

      return NextResponse.json(successResponse(systemStatus));
    } catch (error: any) {
      logger.error({
        message: 'System status check failed',
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
        message: 'System status check failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
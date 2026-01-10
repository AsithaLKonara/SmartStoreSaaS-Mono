/**
 * Performance Monitoring API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_PERFORMANCE permission)
 * 
 * System-wide: Real-time performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/monitoring
 * Get performance monitoring data (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const memoryUsage = process.memoryUsage();
      
      const monitoring = {
        cpu: { usage: 0 }, // TODO: Implement CPU monitoring
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        requests: { total: 0, rps: 0 }, // TODO: Track requests
        errors: { total: 0, rate: 0 }, // TODO: Track errors
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      };

      logger.info({
        message: 'Performance monitoring data fetched',
        context: {
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(monitoring));
    } catch (error: any) {
      logger.error({
        message: 'Performance monitoring failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Performance monitoring failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


/**
 * Performance Overview API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_PERFORMANCE permission)
 * 
 * System-wide: Performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const memoryUsage = process.memoryUsage();
      
      const performance = {
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        cpu: {
          usage: 0 // TODO: Implement CPU monitoring
        },
        timestamp: new Date().toISOString()
      };

      logger.info({
        message: 'Performance overview fetched',
        context: { userId: user.id }
      });

      return NextResponse.json(successResponse(performance));
    } catch (error: any) {
      logger.error({
        message: 'Performance overview failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

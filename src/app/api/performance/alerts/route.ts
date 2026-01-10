/**
 * Performance Alerts API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_ALERTS permission)
 * - POST: SUPER_ADMIN only (MANAGE_ALERTS permission)
 * 
 * System-wide: Performance alert management
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/alerts
 * Get performance alerts (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // TODO: Fetch actual performance alerts
      logger.info({
        message: 'Performance alerts fetched',
        context: {
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        alerts: [],
        count: 0,
        message: 'Performance alerts - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch performance alerts',
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
        message: 'Failed to fetch performance alerts',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/performance/alerts
 * Create performance alert (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { metric, threshold, action } = body;

      if (!metric || !threshold) {
        throw new ValidationError('Metric and threshold are required', {
          fields: { metric: !metric, threshold: !threshold }
        });
      }

      logger.info({
        message: 'Performance alert created',
        context: {
          userId: user.id,
          metric,
          threshold
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metric,
        threshold,
        status: 'active'
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create performance alert',
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
        message: 'Failed to create performance alert',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


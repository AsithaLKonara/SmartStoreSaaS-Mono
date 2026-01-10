import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/analytics
 * Get customer analytics (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'Customer analytics fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement customer analytics
      // This would typically involve querying analytics data from database
      const analytics = {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        favoriteCategories: []
      };

      return NextResponse.json(successResponse(analytics));
    } catch (error: any) {
      logger.error({
        message: 'Customer analytics failed',
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
        message: 'Customer analytics failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
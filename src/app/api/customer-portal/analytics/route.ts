import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { prisma } from '@/lib/prisma';

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

      // Implement customer analytics from database
      const customer = await prisma.customer.findUnique({
        where: { id: user.id },
        include: { orders: { orderBy: { createdAt: 'desc' } } }
      });

      if (!customer) {
        return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Customer not found' }, { status: 404 });
      }

      const totalOrders = customer.orders.length;
      const totalSpent = Number(customer.totalSpent || 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = customer.orders[0]?.createdAt || null;

      const analytics = {
        totalOrders,
        totalSpent,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        lastOrderDate,
        favoriteCategories: [] // Would require deeper order items schema traversal
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
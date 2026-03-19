/**
 * Orders Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_ORDERS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/stats
 * Get order statistics
 */
export const GET = requirePermission(Permission.ORDER_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || '30';
      const days = parseInt(period);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenueData
      ] = await Promise.all([
        prisma.order.count({ where: { organizationId, createdAt: { gte: startDate } } }),
        prisma.order.count({ where: { organizationId, status: 'PENDING', createdAt: { gte: startDate } } }),
        prisma.order.count({ where: { organizationId, status: 'DELIVERED', createdAt: { gte: startDate } } }),
        prisma.order.aggregate({
          where: { organizationId, status: 'DELIVERED', createdAt: { gte: startDate } },
          _sum: { total: true }
        })
      ]);

      const stats = {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Number(totalRevenueData._sum.total || 0),
        period: `${days}d`
      };

      logger.info({
        message: 'Order statistics fetched',
        context: {
          userId: user.id,
          organizationId,
          totalOrders
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(stats));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch order statistics',
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
        message: 'Failed to fetch order statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * AI Analytics Dashboard API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AI_ANALYTICS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';

import { prisma } from '@/lib/prisma';

export const GET = requirePermission(Permission.AI_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // 1. Fetch Key Performance Data
      const [orderStats, snapshots, topProducts] = await Promise.all([
        prisma.order.aggregate({
          where: { organizationId },
          _sum: { total: true },
          _count: { id: true }
        }),
        prisma.dailySalesSnapshot.findMany({
          where: { organizationId },
          orderBy: { date: 'desc' },
          take: 30
        }),
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: { organizationId } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5
        })
      ]);

      // 2. Generate Intelligent Insights
      const insights = [];
      const totalSales = Number(orderStats._sum.total || 0);
      const orderCount = orderStats._count.id;
      
      if (orderCount > 0) {
        insights.push({
          type: 'INFO',
          message: `Your platform has processed ${orderCount} orders totaling ${totalSales.toFixed(2)} to date.`,
          priority: 'LOW'
        });
      }

      // Low stock check
      const lowStockProducts = await prisma.product.count({
        where: { organizationId, stock: { lte: 10 } }
      });
      if (lowStockProducts > 0) {
        insights.push({
          type: 'CRITICAL',
          message: `${lowStockProducts} products are currently below reorder levels. Immediate procurement suggested.`,
          priority: 'HIGH'
        });
      }

      logger.info({
        message: 'AI analytics dashboard generated successfully',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        stats: {
          totalSales,
          orderCount,
          averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0
        },
        insights,
        history: snapshots.map(s => ({
          date: s.date,
          sales: Number(s.totalSales),
          count: s.orderCount
        })),
        topProducts: topProducts.map(p => ({
          id: p.productId,
          sales: p._sum.quantity
        }))
      }));
    } catch (error: any) {
      logger.error({
        message: 'AI analytics dashboard failed',
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
        message: 'AI analytics dashboard failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

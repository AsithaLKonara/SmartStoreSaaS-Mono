/**
 * Analytics Dashboard API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_ANALYTICS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requirePermission('VIEW_ANALYTICS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || '30';

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Organization not found',
          correlation: req.correlationId
        }, { status: 400 });
      }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const where = { organizationId }
    const orderWhere = {
      ...where,
      createdAt: { gte: startDate }
    };

    // Fetch analytics data
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      recentOrders,
      orderStats
    ] = await Promise.all([
      prisma.product.count({ where }),
      prisma.customer.count({ where }),
      prisma.order.count({ where: orderWhere }),
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.order.aggregate({
        where: orderWhere,
        _sum: { total: true },
        _count: true
      })
    ]);

    const totalRevenue = Number(orderStats._sum.total || 0);
    const averageOrderValue = orderStats._count > 0 
      ? totalRevenue / orderStats._count 
      : 0;

    // Get top products
    const topProductsData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        });
        return {
          productId: item.productId,
          name: product?.name || 'Unknown',
          revenue: Number(item._sum.total || 0),
          orders: item._count.productId
        };
      })
    );

    const analytics = {
      revenue: { total: totalRevenue, trend: 'up' },
      orders: { total: totalOrders, trend: 'up' },
      customers: { total: totalCustomers, trend: 'up' },
      products: { total: totalProducts, trend: 'up' },
      topProducts,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customer,
        totalAmount: Number(o.total),
        status: o.status,
        createdAt: o.createdAt.toISOString()
      })),
      period: `${period}d`,
      generatedAt: new Date().toISOString()
    };

      logger.info({
        message: 'Analytics dashboard fetched',
        context: {
          period,
          organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(analytics));
    } catch (error: any) {
      logger.error({
        message: 'Analytics dashboard error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { 
          path: req.nextUrl.pathname,
          organizationId: user.organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({ 
        success: false, 
        code: 'ERR_INTERNAL',
        message: 'Analytics dashboard error',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);


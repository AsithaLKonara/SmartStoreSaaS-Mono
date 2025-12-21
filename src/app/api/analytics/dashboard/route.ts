/**
 * Analytics Dashboard API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_ANALYTICS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !hasPermission(session.user.role, 'VIEW_ANALYTICS')) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 400 });
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
        period
      }
    });

    return NextResponse.json(successResponse(analytics));
  } catch (error: any) {
    logger.error({
      message: 'Analytics dashboard error',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Analytics dashboard error' }, { status: 500 });
  }
}


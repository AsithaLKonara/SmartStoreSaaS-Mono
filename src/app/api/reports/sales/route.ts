import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const organizationId = searchParams.get('organizationId');

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get orders within date range
    const orders = await prisma.order.findMany({
      where: {
        ...(organizationId && { organizationId }),
        createdAt: { gte: start, lte: end }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true }
            }
          }
        },
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += Number(item.total);
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily sales trend
    const dailySales: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + Number(order.total);
    });

    return NextResponse.json({
      success: true,
      report: {
        period: { start, end },
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          ordersByStatus
        },
        topProducts,
        dailySales: Object.entries(dailySales).map(([date, revenue]) => ({ date, revenue })),
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.customer.name,
          total: Number(o.total),
          status: o.status,
          createdAt: o.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Sales report error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


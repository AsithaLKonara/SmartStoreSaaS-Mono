export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalSuppliers,
      activeSuppliers,
      totalPurchaseOrders,
      totalValue,
      averageOrderValue,
      topSuppliers,
      monthlyTrends,
      categoryBreakdown,
    ] = await Promise.all([
      // Total suppliers
      prisma.suppliers.count({
        where: { organizationId: session.user.organizationId },
      }),
      
      // Active suppliers (with orders in period)
      prisma.suppliers.count({
      where: {
        organizationId: session.user.organizationId,
          purchase_orders: {
            some: {
              orderDate: { gte: startDate, lte: endDate },
            },
      },
      },
      }),

      // Total purchase orders in period
      prisma.purchase_orders.count({
      where: {
        organizationId: session.user.organizationId,
          orderDate: { gte: startDate, lte: endDate },
        },
      }),
      
      // Total value in period
      prisma.purchase_orders.aggregate({
      where: {
        organizationId: session.user.organizationId,
          orderDate: { gte: startDate, lte: endDate },
      },
        _sum: { total: true },
      }),

      // Average order value
      prisma.purchase_orders.aggregate({
      where: {
        organizationId: session.user.organizationId,
          orderDate: { gte: startDate, lte: endDate },
        },
        _avg: { total: true },
      }),
      
      // Top suppliers by value
      prisma.suppliers.findMany({
        where: { organizationId: session.user.organizationId },
        include: {
          purchase_orders: {
      where: {
              orderDate: { gte: startDate, lte: endDate },
            },
            select: { total: true },
          },
        },
        orderBy: { totalValue: 'desc' },
        take: 5,
      }),
      
      // Monthly trends (last 12 months)
      getMonthlyTrends(session.user.organizationId),
      
      // Category breakdown
      getCategoryBreakdown(session.user.organizationId, startDate, endDate),
    ]);

    const analytics = {
      overview: {
        totalSuppliers,
        activeSuppliers,
        totalPurchaseOrders,
        totalValue: totalValue._sum.total || 0,
        averageOrderValue: averageOrderValue._avg.total || 0,
        period: {
          days: parseInt(period),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      topSuppliers: topSuppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        totalOrders: supplier.purchase_orders.length,
        totalValue: supplier.purchase_orders.reduce((sum, po) => sum + po.total, 0),
        rating: supplier.rating,
      })),
      trends: monthlyTrends,
      categoryBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching procurement analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch procurement analytics' },
      { status: 500 }
    );
  }
}

async function getMonthlyTrends(organizationId: string) {
  const trends = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const [orderCount, totalValue] = await Promise.all([
      prisma.purchase_orders.count({
        where: {
          organizationId,
          orderDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.purchase_orders.aggregate({
        where: {
          organizationId,
          orderDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { total: true },
      }),
    ]);
    
    trends.push({
      month: monthStart.toISOString().substring(0, 7), // YYYY-MM
      orderCount,
      totalValue: totalValue._sum.total || 0,
    });
  }
  
  return trends;
}

async function getCategoryBreakdown(organizationId: string, startDate: Date, endDate: Date) {
  const breakdown = await prisma.purchase_order_items.findMany({
    where: {
      purchase_orders: {
        organizationId,
        orderDate: { gte: startDate, lte: endDate },
      },
    },
    include: {
      products: {
        include: {
          categories: true,
        },
      },
    },
  });

  const categoryMap = new Map();
  
  breakdown.forEach(item => {
    const categoryName = item.products.categories?.name || 'Uncategorized';
    const current = categoryMap.get(categoryName) || { count: 0, value: 0 };
    categoryMap.set(categoryName, {
      count: current.count + item.quantity,
      value: current.value + item.totalPrice,
    });
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ...data,
  }));
}
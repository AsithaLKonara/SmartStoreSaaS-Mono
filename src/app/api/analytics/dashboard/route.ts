export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const organizationId = session.user.organizationId;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get analytics data
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      salesByDay,
      customerGrowth
    ] = await Promise.all([
      // Total orders
      db.order.count({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Total revenue
      db.order.aggregate({
        where: {
          organizationId,
          createdAt: { gte: startDate },
          status: { in: ['completed', 'shipped', 'delivered'] }
        },
        _sum: { total: true }
      }),
      
      // Total customers
      db.customer.count({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Total products
      db.product.count({
        where: {
          organizationId,
          isActive: true
        }
      }),
      
      // Recent orders
      db.order.findMany({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      
      // Top products
      db.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            organizationId,
            createdAt: { gte: startDate },
            status: { in: ['completed', 'shipped', 'delivered'] }
          }
        },
        _sum: { quantity: true },
        _count: { productId: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      
      // Sales by day (mock data for now)
      Promise.resolve([]),
      
      // Customer growth (mock data for now)
      Promise.resolve([])
    ]);

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { name: true, price: true }
        });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          quantity: item._sum.quantity || 0,
          orders: item._count.productId || 0,
          revenue: (product?.price || 0) * (item._sum.quantity || 0)
        };
      })
    );

    const analytics = {
      overview: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalCustomers,
        totalProducts,
        averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customerName: order.customer.name,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length
      })),
      topProducts: topProductsWithDetails,
      salesByDay: [], // Mock data
      customerGrowth: [], // Mock data
      period,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

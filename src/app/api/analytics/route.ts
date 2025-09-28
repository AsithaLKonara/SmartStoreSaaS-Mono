import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withProtection } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/analytics - Get comprehensive analytics data
async function getAnalytics(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter: unknown = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      dateFilter = {
        gte: new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
      };
    }

    const organizationId = request.user!.organizationId;

    // Get sales metrics
    const salesData = await prisma.order.aggregate({
      where: {
        organizationId,
        createdAt: dateFilter,
        status: { notIn: ['CANCELLED', 'RETURNED'] }
      },
      _sum: {
        totalAmount: true,
        subtotal: true,
        tax: true,
        shipping: true
      },
      _count: {
        id: true
      }
    });

    // Get order status distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['status'],
      where: {
        organizationId,
        createdAt: dateFilter
      },
      _count: {
        id: true
      }
    });

    // Get payment status distribution
    const paymentStatusDistribution = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        organizationId,
        createdAt: dateFilter
      },
      _count: {
        id: true
      }
    });

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          organizationId,
          createdAt: dateFilter,
          status: { notIn: ['CANCELLED', 'RETURNED'] }
        }
      },
      _sum: {
        quantity: true,
        total: true
      },
      _count: {
        orderId: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true, images: true }
        });
        
        return {
          ...item,
          product,
          revenue: item._sum.total || 0,
          unitsSold: item._sum.quantity || 0,
          orderCount: item._count.orderId
        };
      })
    );

    // Get customer metrics
    const customerMetrics = await prisma.customer.aggregate({
      where: {
        organizationId,
        createdAt: dateFilter
      },
      _count: {
        id: true
      }
    });

    // Get new vs returning customers
    const newCustomers = await prisma.customer.count({
      where: {
        organizationId,
        createdAt: dateFilter
      }
    });

    const returningCustomers = await prisma.customer.count({
      where: {
        organizationId,
        createdAt: { lt: dateFilter.gte },
        orders: {
          some: {
            createdAt: dateFilter,
            status: { notIn: ['CANCELLED', 'RETURNED'] }
          }
        }
      }
    });

    // Get daily sales trend
    const dailySales = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        organizationId,
        createdAt: dateFilter,
        status: { notIn: ['CANCELLED', 'RETURNED'] }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get inventory alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        organizationId,
        stockQuantity: { lte: 10 },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        price: true
      },
      orderBy: {
        stockQuantity: 'asc'
      },
      take: 10
    });

    // Calculate key metrics
    const totalRevenue = salesData._sum.totalAmount || 0;
    const totalOrders = salesData._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = customerMetrics._count.id || 0;

    // Calculate growth rates (simplified - would need historical data for real growth)
    const growthRate = 0; // Placeholder - would calculate from historical data

    const analyticsData = {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalCustomers,
        growthRate,
        period
      },
      sales: {
        revenue: totalRevenue,
        orders: totalOrders,
        averageOrderValue,
        dailyTrend: dailySales.map(day => ({
          date: day.createdAt,
          revenue: day._sum.totalAmount || 0,
          orders: day._count.id || 0
        }))
      },
      orders: {
        statusDistribution: orderStatusDistribution.map(status => ({
          status: status.status,
          count: status._count.id
        })),
        paymentStatusDistribution: paymentStatusDistribution.map(payment => ({
          status: payment.paymentStatus,
          count: payment._count.id
        }))
      },
      products: {
        topSellers: topProductsWithDetails,
        lowStock: lowStockProducts
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        returning: returningCustomers,
        retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0
      },
      insights: {
        bestPerformingProduct: topProductsWithDetails[0] || null,
        revenuePerCustomer: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
        orderFrequency: totalCustomers > 0 ? totalOrders / totalCustomers : 0
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withProtection()(getAnalytics); 
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
    const period = searchParams.get('period') || '24h';
    const organizationId = session.user.organizationId;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 1);
    }

    // Get comprehensive metrics
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentActivity,
      systemMetrics
    ] = await Promise.all([
      // Business metrics
      db.order.count({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      }),
      
      db.order.aggregate({
        where: {
          organizationId,
          createdAt: { gte: startDate },
          status: { in: ['completed', 'shipped', 'delivered'] }
        },
        _sum: { total: true }
      }),
      
      db.customer.count({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      }),
      
      db.product.count({
        where: {
          organizationId,
          isActive: true
        }
      }),
      
      // Recent activity
      db.order.findMany({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        },
        take: 10,
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
      
      // System metrics
      Promise.resolve({
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      })
    ]);

    // Calculate additional metrics
    const averageOrderValue = totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    const metrics = {
      period,
      organizationId,
      business: {
        orders: {
          total: totalOrders,
          revenue: totalRevenue._sum.total || 0,
          averageValue: Math.round(averageOrderValue * 100) / 100
        },
        customers: {
          total: totalCustomers,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        products: {
          total: totalProducts,
          active: totalProducts
        }
      },
      activity: {
        recentOrders: recentActivity.map(order => ({
          id: order.id,
          customerName: order.customer.name,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          itemCount: order.items.length
        }))
      },
      system: {
        memory: {
          rss: Math.round(systemMetrics.memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(systemMetrics.memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(systemMetrics.memoryUsage.heapTotal / 1024 / 1024) // MB
        },
        uptime: Math.floor(systemMetrics.uptime),
        nodeVersion: systemMetrics.nodeVersion,
        timestamp: systemMetrics.timestamp
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

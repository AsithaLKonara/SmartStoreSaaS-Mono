import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30days';
    const organizationId = user.organizationId;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user's organization
    const userData = await prisma.user.findUnique({
      where: { email: user.email },
      select: { organizationId: true }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orgId = organizationId || userData.organizationId;

    // Get customers with their order data
    const customers = await prisma.customer.findMany({
      where: { organizationId: orgId },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate insights for each customer
    const insights = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = customer.orders.length;
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      // Calculate customer lifetime value (simplified)
      const customerLifetimeValue = totalSpent * 1.2; // 20% margin
      
      // Calculate growth rate (simplified - comparing first half vs second half)
      const midPoint = new Date(startDate.getTime() + (now.getTime() - startDate.getTime()) / 2);
      const firstHalfOrders = customer.orders.filter(order => order.createdAt < midPoint);
      const secondHalfOrders = customer.orders.filter(order => order.createdAt >= midPoint);
      
      const firstHalfSpent = firstHalfOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const secondHalfSpent = secondHalfOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      const growthRate = firstHalfSpent > 0 
        ? ((secondHalfSpent - firstHalfSpent) / firstHalfSpent) * 100 
        : secondHalfSpent > 0 ? 100 : 0;

      // Determine customer segment
      let segment: 'VIP' | 'Regular' | 'New' | 'At Risk';
      if (totalSpent > 100000) {
        segment = 'VIP';
      } else if (totalSpent > 25000) {
        segment = 'Regular';
      } else if (totalOrders <= 2) {
        segment = 'New';
      } else {
        segment = 'At Risk';
      }

      // Get preferred categories
      const categoryCounts: { [key: string]: number } = {};
      customer.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product.category) {
            categoryCounts[item.product.category] = (categoryCounts[item.product.category] || 0) + item.quantity;
          }
        });
      });
      
      const preferredCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Calculate average days between orders
      const orderDates = customer.orders
        .map(order => order.createdAt)
        .sort((a, b) => a.getTime() - b.getTime());
      
      let avgDaysBetweenOrders = 0;
      if (orderDates.length > 1) {
        const totalDays = orderDates.reduce((sum, date, index) => {
          if (index === 0) return 0;
          return sum + (date.getTime() - orderDates[index - 1].getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        avgDaysBetweenOrders = totalDays / (orderDates.length - 1);
      }

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent,
        totalOrders,
        averageOrderValue,
        lastOrderDate: customer.orders.length > 0 
          ? customer.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
          : null,
        customerLifetimeValue,
        segment,
        growthRate,
        preferredCategories,
        avgDaysBetweenOrders: Math.round(avgDaysBetweenOrders)
      };
    });

    // Calculate segment statistics
    const segmentStats: { [key: string]: any } = {};
    insights.forEach(insight => {
      if (!segmentStats[insight.segment]) {
        segmentStats[insight.segment] = {
          segment: insight.segment,
          count: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          growthRate: 0
        };
      }
      
      segmentStats[insight.segment].count++;
      segmentStats[insight.segment].totalSpent += insight.totalSpent;
      segmentStats[insight.segment].avgOrderValue += insight.averageOrderValue;
      segmentStats[insight.segment].growthRate += insight.growthRate;
    });

    // Calculate averages for segments
    const segments = Object.values(segmentStats).map(segment => ({
      ...segment,
      avgOrderValue: segment.count > 0 ? segment.avgOrderValue / segment.count : 0,
      growthRate: segment.count > 0 ? segment.growthRate / segment.count : 0
    }));

    return NextResponse.json({
      insights,
      segments,
      summary: {
        totalCustomers: insights.length,
        totalRevenue: insights.reduce((sum, insight) => sum + insight.totalSpent, 0),
        averageOrderValue: insights.reduce((sum, insight) => sum + insight.averageOrderValue, 0) / insights.length || 0,
        averageGrowthRate: insights.reduce((sum, insight) => sum + insight.growthRate, 0) / insights.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching customer insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export with authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

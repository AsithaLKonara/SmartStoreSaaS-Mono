import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictiveAnalytics';
import { AIRecommendationEngine } from '@/lib/ai/recommendationEngine';

export const dynamic = 'force-dynamic';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const organizationId = user.organizationId;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales analytics
    const salesData = await prisma.order.groupBy({
      by: ['status'],
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      _count: { status: true },
      _sum: { totalAmount: true },
    });

    // Get revenue trends (daily for the period)
    const revenueTrends = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        SUM(totalAmount) as revenue,
        COUNT(*) as orders
      FROM "Order" 
      WHERE organizationId = ${organizationId} 
        AND createdAt >= ${startDate}
        AND status IN ('COMPLETED', 'DELIVERED')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          organizationId,
          createdAt: { gte: startDate },
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
      },
      _sum: { quantity: true, total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    // Get top products with names
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.total || 0,
          orderCount: item._count.id,
        };
      })
    );

    // Get customer analytics
    const customerStats = await prisma.customer.groupBy({
      by: ['organizationId'],
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    // Get loyalty tier distribution
    const loyaltyStats = await prisma.customerLoyalty.groupBy({
      by: ['tier'],
      where: { organizationId },
      _count: { tier: true },
      _avg: { points: true, totalSpent: true },
    });

    // Get inventory alerts (low stock)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        organizationId,
        stockQuantity: { lte: 10 },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        price: true,
      },
      orderBy: { stockQuantity: 'asc' },
      take: 20,
    });

    // Get recent activity
    const recentOrders = await prisma.order.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate key metrics
    const totalRevenue = salesData
      .filter(item => ['COMPLETED', 'DELIVERED'].includes(item.status))
      .reduce((sum, item) => sum + (item._sum.totalAmount || 0), 0);

    const totalOrders = salesData.reduce((sum, item) => sum + item._count.status, 0);
    const completedOrders = salesData
      .filter(item => ['COMPLETED', 'DELIVERED'].includes(item.status))
      .reduce((sum, item) => sum + item._count.status, 0);

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Get period-over-period comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const previousRevenue = await prisma.order.aggregate({
      where: {
        organizationId,
        createdAt: { gte: previousStartDate, lt: startDate },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { totalAmount: true },
    });

    const revenueGrowth = previousRevenue._sum.totalAmount && totalRevenue > 0
      ? ((totalRevenue - previousRevenue._sum.totalAmount) / previousRevenue._sum.totalAmount) * 100
      : 0;

    // Get AI-powered insights
    const predictiveEngine = new PredictiveAnalyticsEngine();
    const recommendationEngine = new AIRecommendationEngine();
    
    let aiInsights = {};
    
    try {
      // Get demand forecasts for top products
      const topProductIds = topProductsWithNames.slice(0, 5).map(p => p.productId);
      const demandForecasts = await predictiveEngine.predictDemand(organizationId, topProductIds);
      
      // Get customer churn predictions
      const churnPredictions = await predictiveEngine.predictCustomerChurn(organizationId);
      
      // Get revenue forecast
      const revenueForecasts = await predictiveEngine.forecastRevenue(organizationId, 3);
      
      // Get personalized recommendations for top customers
      const topCustomers = await prisma.customer.findMany({
        where: { organizationId },
        orderBy: { totalSpent: 'desc' },
        take: 3
      });
      
      const customerRecommendations = await Promise.all(
        topCustomers.map(async (customer) => {
          const recs = await recommendationEngine.getRecommendations(
            customer.id,
            organizationId,
            3
          );
          return {
            customerId: customer.id,
            customerName: customer.name,
            recommendations: recs
          };
        })
      );
      
      aiInsights = {
        demandForecasts: demandForecasts.slice(0, 5),
        churnPredictions: churnPredictions.slice(0, 10),
        revenueForecasts,
        customerRecommendations,
        aiEnabled: true
      };
    } catch (error) {
      console.error('AI insights error:', error);
      aiInsights = { aiEnabled: false, error: 'AI insights temporarily unavailable' };
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          completedOrders,
          conversionRate: Math.round(conversionRate * 100) / 100,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          period: `${days} days`,
        },
        sales: {
          byStatus: salesData,
          revenueTrends,
          topProducts: topProductsWithNames,
        },
        customers: {
          newCustomers: customerStats[0]?._count.id || 0,
          loyaltyDistribution: loyaltyStats,
        },
        inventory: {
          lowStockProducts,
          lowStockCount: lowStockProducts.length,
        },
        recentActivity: {
          orders: recentOrders,
        },
        aiInsights,
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
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

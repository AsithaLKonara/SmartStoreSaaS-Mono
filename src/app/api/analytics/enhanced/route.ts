import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const organizationId = user.organizationId;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
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

    // Get previous period for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    // Fetch orders data
    const [currentOrders, previousOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.order.findMany({
        where: {
          organizationId,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      })
    ]);

    // Calculate KPIs
    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    const orderGrowth = previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0;

    // Get unique customers
    const currentCustomers = new Set(currentOrders.map(order => order.customerId));
    const previousCustomers = new Set(previousOrders.map(order => order.customerId));
    const customerGrowth = previousCustomers.size > 0 ? ((currentCustomers.size - previousCustomers.size) / previousCustomers.size) * 100 : 0;

    // Get products
    const products = await prisma.product.findMany({
      where: { organizationId }
    });
    const productGrowth = 0; // Placeholder

    const averageOrderValue = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const conversionRate = 15.5; // Placeholder - would need visitor data
    const customerRetentionRate = 78.2; // Placeholder - would need customer analysis

    // Generate trend data (mock data for demonstration)
    const trendData = generateTrendData(startDate, now, currentOrders);

    // Generate geographic data (mock data for demonstration)
    const geographicData = generateGeographicData();

    // Generate device data (mock data for demonstration)
    const deviceData = generateDeviceData();

    // Generate product performance data
    const productPerformance = generateProductPerformance(currentOrders);

    // Generate customer segments (mock data for demonstration)
    const customerSegments = generateCustomerSegments();

    // Generate alerts
    const alerts = generateAlerts(currentOrders, currentRevenue, currentOrderCount);

    const kpiData = {
      totalSales: currentRevenue,
      totalOrders: currentOrderCount,
      totalCustomers: currentCustomers.size,
      totalProducts: products.length,
      averageOrderValue,
      conversionRate,
      customerRetentionRate,
      revenueGrowth,
      orderGrowth,
      customerGrowth,
      productGrowth
    };

    return NextResponse.json({
      kpis: kpiData,
      trends: trendData,
      geographic: geographicData,
      devices: deviceData,
      products: productPerformance,
      segments: customerSegments,
      alerts
    });

  } catch (error) {
    console.error('Error fetching enhanced analytics:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Export with authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

function generateTrendData(startDate: Date, endDate: Date, orders: any[]) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const trendData = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === date.toDateString();
    });
    
    const sales = dayOrders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = dayOrders.length;
    const customerCount = new Set(dayOrders.map(order => order.customerId)).size;
    
    trendData.push({
      date: date.toISOString().split('T')[0],
      sales,
      orders: orderCount,
      customers: customerCount,
      revenue: sales
    });
  }
  
  return trendData;
}

function generateGeographicData() {
  return [
    { region: 'Colombo', sales: 1250000, orders: 450, customers: 320, growth: 12.5 },
    { region: 'Kandy', sales: 850000, orders: 280, customers: 190, growth: 8.3 },
    { region: 'Galle', sales: 620000, orders: 180, customers: 140, growth: 15.2 },
    { region: 'Jaffna', sales: 480000, orders: 150, customers: 110, growth: 6.7 },
    { region: 'Anuradhapura', sales: 350000, orders: 120, customers: 85, growth: 9.1 }
  ];
}

function generateDeviceData() {
  return [
    { device: 'Mobile', visits: 15420, orders: 850, conversion: 5.5 },
    { device: 'Desktop', visits: 12300, orders: 920, conversion: 7.5 },
    { device: 'Tablet', visits: 3200, orders: 180, conversion: 5.6 }
  ];
}

function generateProductPerformance(orders: any[]) {
  const productMap = new Map();
  
  orders.forEach(order => {
    order.orderItems.forEach((item: any) => {
      const productId = item.productId;
      const productName = item.product?.name || 'Unknown Product';
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          name: productName,
          sales: 0,
          orders: 0,
          revenue: 0,
          growth: Math.random() * 20 - 10 // Random growth between -10% and 10%
        });
      }
      
      const product = productMap.get(productId);
      product.sales += item.quantity;
      product.orders += 1;
      product.revenue += item.total;
    });
  });
  
  return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
}

function generateCustomerSegments() {
  return [
    {
      segment: 'High Value',
      count: 45,
      revenue: 850000,
      averageOrderValue: 18889,
      retentionRate: 92.5
    },
    {
      segment: 'Regular',
      count: 180,
      revenue: 650000,
      averageOrderValue: 3611,
      retentionRate: 78.3
    },
    {
      segment: 'New',
      count: 95,
      revenue: 320000,
      averageOrderValue: 3368,
      retentionRate: 65.2
    },
    {
      segment: 'At Risk',
      count: 25,
      revenue: 150000,
      averageOrderValue: 6000,
      retentionRate: 45.8
    }
  ];
}

function generateAlerts(orders: any[], revenue: number, orderCount: number) {
  const alerts = [];
  
  // Revenue alert
  if (revenue < 100000) {
    alerts.push({
      id: 'revenue-low',
      type: 'warning',
      title: 'Low Revenue Alert',
      message: `Revenue is below expected threshold. Current: ${revenue.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      action: 'View Details'
    });
  }
  
  // Order count alert
  if (orderCount < 50) {
    alerts.push({
      id: 'orders-low',
      type: 'info',
      title: 'Order Count Below Average',
      message: `Order count is lower than usual. Consider marketing campaigns.`,
      timestamp: new Date().toISOString(),
      action: 'Create Campaign'
    });
  }
  
  // Success alert
  if (revenue > 500000) {
    alerts.push({
      id: 'revenue-high',
      type: 'success',
      title: 'Revenue Target Achieved',
      message: `Congratulations! You've exceeded your revenue target.`,
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
}
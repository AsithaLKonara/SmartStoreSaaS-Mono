import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get AI predictions for various business metrics
        const { searchParams } = new URL(request.url);
        const predictionType = searchParams.get('type') || 'all'; // sales, inventory, customers, trends
        const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d

        const predictions: any = {};

        // Sales Predictions
        if (predictionType === 'all' || predictionType === 'sales') {
          const salesPredictions = await generateSalesPredictions(user.organizationId, timeframe);
          predictions.sales = salesPredictions;
        }

        // Inventory Predictions
        if (predictionType === 'all' || predictionType === 'inventory') {
          const inventoryPredictions = await generateInventoryPredictions(user.organizationId, timeframe);
          predictions.inventory = inventoryPredictions;
        }

        // Customer Predictions
        if (predictionType === 'all' || predictionType === 'customers') {
          const customerPredictions = await generateCustomerPredictions(user.organizationId, timeframe);
          predictions.customers = customerPredictions;
        }

        // Trend Predictions
        if (predictionType === 'all' || predictionType === 'trends') {
          const trendPredictions = await generateTrendPredictions(user.organizationId, timeframe);
          predictions.trends = trendPredictions;
        }

        return NextResponse.json({
          predictions,
          timeframe,
          generatedAt: new Date().toISOString(),
          confidence: calculateOverallConfidence(predictions),
        });

      case 'POST':
        // Generate custom prediction based on specific parameters
        const body = await request.json();
        const { productId, categoryId, customerSegment, predictionDays } = body;

        let customPrediction = null;

        if (productId) {
          customPrediction = await generateProductPrediction(productId, predictionDays || 30);
        } else if (categoryId) {
          customPrediction = await generateCategoryPrediction(categoryId, predictionDays || 30);
        } else if (customerSegment) {
          customPrediction = await generateCustomerSegmentPrediction(customerSegment, predictionDays || 30);
        } else {
          return NextResponse.json(
            { error: 'Please specify productId, categoryId, or customerSegment' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          prediction: customPrediction,
          generatedAt: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('AI Predictions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Sales predictions based on historical data
async function generateSalesPredictions(organizationId: string, timeframe: string) {
  const days = parseInt(timeframe.replace('d', ''));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get historical sales data
  const historicalOrders = await prisma.order.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      total: true,
      createdAt: true,
      status: true,
    },
  });

  if (historicalOrders.length === 0) {
    return {
      predictedRevenue: 0,
      predictedOrders: 0,
      confidence: 0.1,
      trend: 'insufficient_data',
      recommendations: ['Add more sales data to improve prediction accuracy'],
    };
  }

  // Calculate daily averages
  const dailyRevenue = historicalOrders.reduce((acc: any, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { revenue: 0, orders: 0 };
    }
    if (order.status === 'DELIVERED') {
      acc[date].revenue += parseFloat(order.total.toString());
      acc[date].orders += 1;
    }
    return acc;
  }, {});

  const dailyAverages = Object.values(dailyRevenue) as any[];
  const avgDailyRevenue = dailyAverages.reduce((sum, day) => sum + day.revenue, 0) / dailyAverages.length;
  const avgDailyOrders = dailyAverages.reduce((sum, day) => sum + day.orders, 0) / dailyAverages.length;

  // Simple trend analysis
  const sortedDays = Object.entries(dailyRevenue).sort(([a], [b]) => a.localeCompare(b));
  const recentTrend = calculateTrend(sortedDays.slice(-7).map(([, data]: any) => data.revenue));
  const overallTrend = calculateTrend(sortedDays.map(([, data]: any) => data.revenue));

  // Predictions for next period
  const trendMultiplier = recentTrend > 0 ? 1.1 : recentTrend < 0 ? 0.9 : 1.0;
  const predictedRevenue = avgDailyRevenue * days * trendMultiplier;
  const predictedOrders = avgDailyOrders * days * trendMultiplier;

  return {
    predictedRevenue: Math.round(predictedRevenue),
    predictedOrders: Math.round(predictedOrders),
    confidence: Math.min(0.9, Math.max(0.3, historicalOrders.length / 100)),
    trend: overallTrend > 0.1 ? 'growing' : overallTrend < -0.1 ? 'declining' : 'stable',
    recommendations: generateSalesRecommendations(recentTrend, predictedRevenue),
  };
}

// Inventory predictions for stock management
async function generateInventoryPredictions(organizationId: string, timeframe: string) {
  const days = parseInt(timeframe.replace('d', ''));
  
  // Get products with recent sales
  const products = await prisma.product.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
            status: 'DELIVERED',
          },
        },
        select: {
          quantity: true,
        },
      },
    },
  });

  const inventoryPredictions = products.map(product => {
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const dailyAverage = totalSold / days;
    const predictedDemand = dailyAverage * days;
    const daysUntilStockout = product.stock > 0 && dailyAverage > 0 ? Math.floor(product.stock / dailyAverage) : 999;
    
    let recommendation = 'maintain';
    if (daysUntilStockout < 7) {
      recommendation = 'urgent_restock';
    } else if (daysUntilStockout < 14) {
      recommendation = 'restock_soon';
    } else if (daysUntilStockout > 60) {
      recommendation = 'overstocked';
    }

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      minStock: product.minStock,
      predictedDemand,
      daysUntilStockout,
      recommendation,
      confidence: Math.min(0.9, Math.max(0.3, totalSold / 10)),
    };
  });

  return {
    products: inventoryPredictions,
    urgentRestocks: inventoryPredictions.filter(p => p.recommendation === 'urgent_restock').length,
    overstocked: inventoryPredictions.filter(p => p.recommendation === 'overstocked').length,
    averageConfidence: inventoryPredictions.reduce((sum, p) => sum + p.confidence, 0) / inventoryPredictions.length,
  };
}

// Customer behavior predictions
async function generateCustomerPredictions(organizationId: string, timeframe: string) {
  const days = parseInt(timeframe.replace('d', ''));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get customer data
  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
    },
    include: {
      orders: {
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          total: true,
          createdAt: true,
          status: true,
        },
      },
      loyalty: {
        select: {
          points: true,
          tier: true,
          totalSpent: true,
          lastActivity: true,
        },
      },
    },
  });

  // Predict customer churn and lifetime value
  const customerPredictions = customers.map(customer => {
    const recentOrders = customer.orders.filter(order => 
      order.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const daysSinceLastOrder = customer.orders.length > 0 
      ? Math.floor((Date.now() - Math.max(...customer.orders.map(o => o.createdAt.getTime()))) / (1000 * 60 * 60 * 24))
      : 999;

    // Simple churn prediction
    let churnRisk = 'low';
    if (daysSinceLastOrder > 90) {
      churnRisk = 'high';
    } else if (daysSinceLastOrder > 30) {
      churnRisk = 'medium';
    }

    // Predict future value
    const avgOrderValue = customer.orders.length > 0 
      ? customer.orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) / customer.orders.length
      : 0;
    
    const orderFrequency = customer.orders.length / (days / 30); // orders per month
    const predictedMonthlyValue = avgOrderValue * orderFrequency;
    const predictedYearlyValue = predictedMonthlyValue * 12;

    return {
      customerId: customer.id,
      customerName: customer.name,
      churnRisk,
      predictedMonthlyValue: Math.round(predictedMonthlyValue),
      predictedYearlyValue: Math.round(predictedYearlyValue),
      daysSinceLastOrder,
      loyaltyTier: customer.loyalty?.[0]?.tier || 'BRONZE',
    };
  });

  const highRiskCustomers = customerPredictions.filter(c => c.churnRisk === 'high').length;
  const totalPredictedValue = customerPredictions.reduce((sum, c) => sum + c.predictedYearlyValue, 0);

  return {
    customers: customerPredictions,
    highRiskCustomers,
    totalPredictedValue,
    averageCustomerValue: customerPredictions.length > 0 ? totalPredictedValue / customerPredictions.length : 0,
    recommendations: generateCustomerRecommendations(highRiskCustomers, customerPredictions.length),
  };
}

// Market trend predictions
async function generateTrendPredictions(organizationId: string, timeframe: string) {
  const days = parseInt(timeframe.replace('d', ''));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get category performance trends
  const categoryData = await prisma.category.findMany({
    where: {
      products: {
        some: {
          organizationId,
        },
      },
    },
    include: {
      products: {
        where: {
          organizationId,
        },
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: {
                  gte: startDate,
                },
                status: 'DELIVERED',
              },
            },
            select: {
              quantity: true,
              price: true,
            },
          },
        },
      },
    },
  });

  const trendAnalysis = categoryData.map(category => {
    const totalRevenue = category.products.reduce((sum, product) => 
      sum + product.orderItems.reduce((itemSum, item) => 
        itemSum + (parseFloat(item.price.toString()) * item.quantity), 0
      ), 0
    );

    const totalQuantity = category.products.reduce((sum, product) => 
      sum + product.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    return {
      categoryName: category.name,
      revenue: totalRevenue,
      quantitySold: totalQuantity,
      trend: totalRevenue > 0 ? 'growing' : 'stable',
      growthPotential: totalRevenue > 0 ? 'high' : 'medium',
    };
  });

  return {
    categories: trendAnalysis.sort((a, b) => b.revenue - a.revenue),
    emergingTrends: trendAnalysis.filter(t => t.growthPotential === 'high').slice(0, 3),
    decliningTrends: trendAnalysis.filter(t => t.revenue === 0).slice(0, 3),
  };
}

// Helper functions
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
}

function generateSalesRecommendations(trend: number, predictedRevenue: number): string[] {
  const recommendations = [];
  
  if (trend < -0.1) {
    recommendations.push('Sales are declining. Consider promotional campaigns or product updates.');
  } else if (trend > 0.1) {
    recommendations.push('Sales are growing! Consider expanding inventory or adding new products.');
  }
  
  if (predictedRevenue < 10000) {
    recommendations.push('Focus on increasing average order value through upselling.');
  }
  
  return recommendations;
}

function generateCustomerRecommendations(highRiskCustomers: number, totalCustomers: number): string[] {
  const recommendations = [];
  
  if (highRiskCustomers / totalCustomers > 0.2) {
    recommendations.push('High churn risk detected. Implement retention campaigns.');
  }
  
  recommendations.push('Focus on customer lifetime value optimization.');
  
  return recommendations;
}

function calculateOverallConfidence(predictions: any): number {
  const confidenceValues = Object.values(predictions).map((prediction: any) => {
    if (prediction.confidence !== undefined) {
      return prediction.confidence;
    }
    if (prediction.averageConfidence !== undefined) {
      return prediction.averageConfidence;
    }
    return 0.5; // Default confidence
  });
  
  return confidenceValues.length > 0 
    ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
    : 0.5;
}

// Individual prediction generators
async function generateProductPrediction(productId: string, days: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
            status: 'DELIVERED',
          },
        },
        select: {
          quantity: true,
          price: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const dailyAverage = totalSold / days;
  const predictedDemand = dailyAverage * days;

  return {
    productName: product.name,
    currentStock: product.stock,
    predictedDemand,
    daysUntilStockout: product.stock > 0 && dailyAverage > 0 ? Math.floor(product.stock / dailyAverage) : 999,
    confidence: Math.min(0.9, Math.max(0.3, totalSold / 10)),
  };
}

async function generateCategoryPrediction(categoryId: string, days: number) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      products: {
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: {
                  gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
                status: 'DELIVERED',
              },
            },
            select: {
              quantity: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  const totalRevenue = category.products.reduce((sum, product) => 
    sum + product.orderItems.reduce((itemSum, item) => 
      itemSum + (parseFloat(item.price.toString()) * item.quantity), 0
    ), 0
  );

  const dailyRevenue = totalRevenue / days;
  const predictedRevenue = dailyRevenue * days;

  return {
    categoryName: category.name,
    historicalRevenue: totalRevenue,
    predictedRevenue,
    confidence: Math.min(0.9, Math.max(0.3, category.products.length / 10)),
  };
}

async function generateCustomerSegmentPrediction(segment: string, days: number) {
  // This would typically analyze customer segments
  // For now, return a mock prediction
  return {
    segment,
    predictedGrowth: Math.random() * 20 + 5, // 5-25% growth
    confidence: 0.7,
    recommendations: [`Focus on ${segment} customer acquisition`],
  };
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatAddress } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface SalesForecast {
  period: string;
  predictedSales: number;
  confidence: number;
  factors: string[];
}

interface CustomerSegment {
  id: string;
  name: string;
  criteria: string;
  customerCount: number;
  averageValue: number;
  churnRisk: number;
}

interface InventoryForecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedReorder: number;
  reorderDate: Date;
}

interface SeasonalData {
  month: string;
  averageSales: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalFactor: number;
}

interface CourierMetrics {
  courierId: string;
  courierName: string;
  deliverySuccessRate: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  totalDeliveries: number;
}

export class AIAnalyticsService {
  private openai: OpenAI | null = null;

  constructor() {
    // OpenAI client will be initialized lazily when needed
  }

  private getOpenAIClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  // Customer Analytics
  async calculateCustomerLifetimeValue(customerId: string, organizationId: string): Promise<number> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!customer || customer.orders.length === 0) return 0;

      const totalSpent = customer.orders.reduce((sum, order) => sum + Number((order.total as any)), 0);
      const averageOrderValue = totalSpent / customer.orders.length;
      const purchaseFrequency = customer.orders.length / 12; // orders per month
      const customerLifespan = 24; // estimated months

      const clv = averageOrderValue * purchaseFrequency * customerLifespan;
      return Math.round(clv * 100) / 100;
    } catch (error) {
      logger.error({
        message: 'Error calculating CLV',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'calculateCLV', customerId }
      });
      return 0;
    }
  }

  async predictCustomerChurn(customerId: string, organizationId: string): Promise<number> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!customer) return 0.5;

      // Calculate last order date from orders
      const lastOrder = customer.orders[0]; // orders are ordered by createdAt desc
      const daysSinceLastOrder = lastOrder
        ? Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      const orderFrequency = customer.orders.length / 12; // orders per month
      const totalSpent = customer.orders.reduce((sum, order) => sum + Number((order.total as any)), 0);
      const averageOrderValue = totalSpent / Math.max(customer.orders.length, 1);

      // Simple churn prediction model
      let churnRisk = 0.1; // Base risk

      if (daysSinceLastOrder > 90) churnRisk += 0.3;
      if (daysSinceLastOrder > 180) churnRisk += 0.3;
      if (orderFrequency < 0.5) churnRisk += 0.2;
      if (averageOrderValue < 50) churnRisk += 0.1;

      return Math.min(churnRisk, 1);
    } catch (error) {
      logger.error({
        message: 'Error predicting churn',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'predictChurn', customerId }
      });
      return 0.5;
    }
  }

  async segmentCustomers(organizationId: string): Promise<CustomerSegment[]> {
    try {
      const customers = await prisma.customer.findMany({
        where: { organizationId },
        include: {
          orders: {
            where: { organizationId },
          },
        },
      });

      const segments: CustomerSegment[] = [
        {
          id: 'high-value',
          name: 'High Value Customers',
          criteria: 'Total spent > $1000',
          customerCount: customers.filter(c => c.orders.reduce((s, o) => s + Number((o.total as any)), 0) > 1000).length,
          averageValue: customers.filter(c => c.orders.reduce((s, o) => s + Number((o.total as any)), 0) > 1000).reduce((sum, c) => sum + c.orders.reduce((s, o) => s + Number((o.total as any)), 0), 0) / Math.max(customers.filter(c => c.orders.reduce((s, o) => s + Number((o.total as any)), 0) > 1000).length, 1),
          churnRisk: 0.1,
        },
        {
          id: 'regular',
          name: 'Regular Customers',
          criteria: 'Total spent $100-$1000, multiple orders',
          customerCount: customers.filter(c => {
            const spent = c.orders.reduce((s, o) => s + Number((o.total as any)), 0);
            return spent >= 100 && spent <= 1000 && c.orders.length > 1;
          }).length,
          averageValue: customers.filter(c => {
            const spent = c.orders.reduce((s, o) => s + Number((o.total as any)), 0);
            return spent >= 100 && spent <= 1000 && c.orders.length > 1;
          }).reduce((sum, c) => sum + c.orders.reduce((s, o) => s + Number((o.total as any)), 0), 0) / Math.max(customers.filter(c => {
            const spent = c.orders.reduce((s, o) => s + Number((o.total as any)), 0);
            return spent >= 100 && spent <= 1000 && c.orders.length > 1;
          }).length, 1),
          churnRisk: 0.3,
        },
        {
          id: 'new',
          name: 'New Customers',
          criteria: 'First-time buyers',
          customerCount: customers.filter(c => c.orders.length === 1).length,
          averageValue: customers.filter(c => c.orders.length === 1).reduce((sum, c) => sum + c.orders.reduce((s, o) => s + Number((o.total as any)), 0), 0) / Math.max(customers.filter(c => c.orders.length === 1).length, 1),
          churnRisk: 0.6,
        },
        {
          id: 'at-risk',
          name: 'At Risk Customers',
          criteria: 'No orders in last 90 days',
          customerCount: customers.filter(c => {
            if (!c.orders || c.orders.length === 0) return true;
            const lastOrder = c.orders[0];
            if (!lastOrder) return true;
            const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            return daysSinceLastOrder > 90;
          }).length,
          averageValue: 0,
          churnRisk: 0.8,
        },
      ];

      return segments;
    } catch (error) {
      logger.error({
        message: 'Error segmenting customers',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'segmentCustomers', organizationId }
      });
      return [];
    }
  }

  // Sales Analytics
  async forecastSales(timeframe: string, organizationId: string): Promise<SalesForecast[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const salesData = orders.map(order => ({
        date: order.createdAt,
        amount: Number((order.total as any)),
      }));

      const prompt = `
        Analyze this sales data and forecast future sales for ${timeframe}:
        ${JSON.stringify(salesData)}
        
        Return JSON array with:
        - period: string (e.g., "Next Week", "Next Month")
        - predictedSales: number
        - confidence: number (0-1)
        - factors: string[] (factors affecting prediction)
      `;

      const response = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      const result = JSON.parse(content || '[]');
      return result;
    } catch (error) {
      logger.error({
        message: 'Error forecasting sales',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'forecastSales', organizationId, timeframe }
      });
      return [];
    }
  }

  async analyzeSeasonalTrends(organizationId: string): Promise<SeasonalData[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { organizationId },
        select: {
          total: true,
          createdAt: true,
        },
      });

      // Group by month
      const monthlyData = orders.reduce((acc, order) => {
        const month = new Date(order.createdAt).toLocaleString('default', { month: 'long' });
        if (!acc[month]) {
          acc[month] = { total: 0, count: 0 };
        }
        acc[month].total += Number((order.total as any));
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const seasonalData: SeasonalData[] = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        averageSales: data.total / data.count,
        trend: 'stable' as const,
        seasonalFactor: data.total / Math.max(...Object.values(monthlyData).map(d => d.total)),
      }));

      return seasonalData;
    } catch (error) {
      logger.error({
        message: 'Error analyzing seasonal trends',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'analyzeSeasonalTrends', organizationId }
      });
      return [];
    }
  }

  async identifyTopPerformers(organizationId: string): Promise<unknown[]> {
    try {
      const products = await prisma.product.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      const topProducts = products
        .map(product => ({
          id: product.id,
          name: product.name,
          sales: product._count.orderItems,
          revenue: Number((product.price as any)) * product._count.orderItems,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return topProducts;
    } catch (error) {
      logger.error({
        message: 'Error identifying top performers',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'identifyTopPerformers', organizationId }
      });
      return [];
    }
  }

  // Operational Analytics
  async optimizeDeliveryRoutes(organizationId: string): Promise<unknown[]> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          organizationId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        include: {
          customer: true,
        },
      });

      // Simple route optimization - group by area
      const routes = orders.reduce((acc, order) => {
        const addressStr = formatAddress(order.customer.address);
        const area = addressStr.split(',')[1]?.trim() || 'Unknown';
        if (!acc[area]) {
          acc[area] = [];
        }
        acc[area].push(order);
        return acc;
      }, {} as Record<string, typeof orders>);

      return Object.entries(routes).map(([area, areaOrders]) => ({
        area,
        orderCount: areaOrders.length,
        totalValue: areaOrders.reduce((sum, order) => sum + Number((order.total as any)), 0),
        orders: areaOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          address: order.customer.address,
        })),
      }));
    } catch (error) {
      logger.error({
        message: 'Error optimizing delivery routes',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'optimizeDeliveryRoutes', organizationId }
      });
      return [];
    }
  }

  async analyzeCourierPerformance(organizationId: string): Promise<CourierMetrics[]> {
    try {
      const deliveries = await prisma.delivery.findMany({
        where: { organizationId },
        include: {
          courier: true,
          order: true,
        },
      });

      const courierMetrics = deliveries.reduce((acc, delivery) => {
        const courierId = delivery.courierId;
        if (!courierId) return acc; // Skip deliveries without courier

        if (!acc[courierId]) {
          acc[courierId] = {
            courierId,
            courierName: delivery.courier?.name || 'Unknown',
            deliveries: [],
            successfulDeliveries: 0,
            totalDeliveryTime: 0,
          };
        }

        acc[courierId].deliveries.push(delivery);
        if (delivery.status === 'DELIVERED') {
          acc[courierId].successfulDeliveries++;
        }

        if (delivery.actualDelivery && delivery.createdAt) {
          const deliveryTime = new Date(delivery.actualDelivery).getTime() - new Date(delivery.createdAt).getTime();
          acc[courierId].totalDeliveryTime += deliveryTime;
        }

        return acc;
      }, {} as Record<string, any>);

      return Object.values(courierMetrics).map((courier: any) => ({
        courierId: courier.courierId,
        courierName: courier.courierName,
        deliverySuccessRate: courier.successfulDeliveries / courier.deliveries.length,
        averageDeliveryTime: courier.totalDeliveryTime / Math.max(courier.successfulDeliveries, 1) / (1000 * 60 * 60), // hours
        customerSatisfaction: 0.85, // Placeholder - would come from ratings
        totalDeliveries: courier.deliveries.length,
      }));
    } catch (error) {
      logger.error({
        message: 'Error analyzing courier performance',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'analyzeCourierPerformance', organizationId }
      });
      return [];
    }
  }

  async predictInventoryNeeds(organizationId: string): Promise<InventoryForecast[]> {
    try {
      const products = await prisma.product.findMany({
        where: { organizationId },
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      });

      const forecasts: InventoryForecast[] = products.map(product => {
        const monthlyDemand = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const predictedDemand = Math.ceil(monthlyDemand * 1.2); // 20% buffer
        const recommendedReorder = Math.max(predictedDemand - product.stock, 0);
        const reorderDate = new Date(Date.now() + (product.stock / (monthlyDemand || 1)) * 30 * 24 * 60 * 60 * 1000);

        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          predictedDemand,
          recommendedReorder,
          reorderDate,
        };
      });

      return forecasts.filter(forecast => forecast.recommendedReorder > 0);
    } catch (error) {
      logger.error({
        message: 'Error predicting inventory needs',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'predictInventoryNeeds', organizationId }
      });
      return [];
    }
  }

  // Business Intelligence Dashboard
  async generateBusinessInsights(organizationId: string): Promise<any> {
    try {
      const [
        customerSegments,
        salesForecast,
        topProducts,
        inventoryForecast,
        courierMetrics,
      ] = await Promise.all([
        this.segmentCustomers(organizationId),
        this.forecastSales('Next Month', organizationId),
        this.identifyTopPerformers(organizationId),
        this.predictInventoryNeeds(organizationId),
        this.analyzeCourierPerformance(organizationId),
      ]);

      return {
        customerInsights: {
          segments: customerSegments,
          totalCustomers: customerSegments.reduce((sum, segment) => sum + segment.customerCount, 0),
          averageCLV: customerSegments.reduce((sum, segment) => sum + segment.averageValue, 0) / customerSegments.length,
        },
        salesInsights: {
          forecast: salesForecast,
          topProducts,
          seasonalTrends: await this.analyzeSeasonalTrends(organizationId),
        },
        operationalInsights: {
          inventoryForecast,
          courierMetrics,
          deliveryRoutes: await this.optimizeDeliveryRoutes(organizationId),
        },
        recommendations: await this.generateRecommendations(organizationId),
      };
    } catch (error) {
      logger.error({
        message: 'Error generating business insights',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'generateBusinessInsights', organizationId }
      });
      return {};
    }
  }

  private async generateRecommendations(organizationId: string): Promise<string[]> {
    try {
      const prompt = `
        Based on the business data, provide 5 actionable recommendations for improving the business.
        Focus on:
        - Customer retention
        - Sales growth
        - Operational efficiency
        - Inventory management
        - Customer satisfaction
        
        Return JSON array of recommendation strings.
      `;

      const response = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      const result = JSON.parse(content || '[]');
      return result;
    } catch (error) {
      logger.error({
        message: 'Error generating recommendations',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'AnalyticsService', operation: 'generateRecommendations', organizationId }
      });
      return [
        'Focus on customer retention through personalized marketing',
        'Optimize inventory levels based on demand forecasting',
        'Improve delivery performance through courier partnerships',
        'Implement customer feedback system for better satisfaction',
        'Develop loyalty program to increase repeat purchases',
      ];
    }
  }
}

export const aiAnalyticsService = new AIAnalyticsService(); 
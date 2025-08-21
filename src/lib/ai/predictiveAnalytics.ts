import { prisma } from '@/lib/prisma';

export interface DemandForecast {
  productId: string;
  productName: string;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  nextMonth: number;
  nextQuarter: number;
}

export interface CustomerChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  recommendedActions: string[];
}

export interface RevenueForecast {
  period: string;
  predictedRevenue: number;
  confidence: number;
  growthRate: number;
  factors: string[];
}

export class PredictiveAnalyticsEngine {
  private readonly MIN_DATA_POINTS = 30; // Minimum data points for prediction
  private readonly FORECAST_HORIZON = 90; // Days to forecast

  /**
   * Predict product demand for the next period
   */
  async predictDemand(
    organizationId: string,
    productIds?: string[]
  ): Promise<DemandForecast[]> {
    try {
      const products = productIds 
        ? await prisma.product.findMany({ where: { id: { in: productIds } } })
        : await prisma.product.findMany({ 
            where: { 
              organizationId,
              status: 'ACTIVE'
            },
            take: 50 // Limit to top 50 products
          });

      const forecasts: DemandForecast[] = [];

      for (const product of products) {
        const forecast = await this.forecastProductDemand(product.id, organizationId);
        if (forecast) {
          forecasts.push(forecast);
        }
      }

      return forecasts.sort((a, b) => b.predictedDemand - a.predictedDemand);
    } catch (error) {
      console.error('Error predicting demand:', error);
      return [];
    }
  }

  /**
   * Predict customer churn probability
   */
  async predictCustomerChurn(
    organizationId: string,
    customerIds?: string[]
  ): Promise<CustomerChurnPrediction[]> {
    try {
      const customers = customerIds
        ? await prisma.customer.findMany({ where: { id: { in: customerIds } } })
        : await prisma.customer.findMany({ 
            where: { 
              organizationId,
              status: 'ACTIVE'
            },
            take: 100 // Limit to top 100 customers
          });

      const predictions: CustomerChurnPrediction[] = [];

      for (const customer of customers) {
        const prediction = await this.calculateChurnProbability(customer.id, organizationId);
        if (prediction) {
          predictions.push(prediction);
        }
      }

      return predictions.sort((a, b) => b.churnProbability - a.churnProbability);
    } catch (error) {
      console.error('Error predicting customer churn:', error);
      return [];
    }
  }

  /**
   * Forecast revenue for the next periods
   */
  async forecastRevenue(
    organizationId: string,
    periods: number = 3
  ): Promise<RevenueForecast[]> {
    try {
      const forecasts: RevenueForecast[] = [];
      
      // Get historical revenue data
      const historicalData = await this.getHistoricalRevenue(organizationId);
      
      if (historicalData.length < this.MIN_DATA_POINTS) {
        throw new Error('Insufficient data for revenue forecasting');
      }

      // Calculate trend and seasonality
      const trend = this.calculateTrend(historicalData);
      const seasonality = this.calculateSeasonality(historicalData);

      // Generate forecasts for each period
      for (let i = 1; i <= periods; i++) {
        const forecast = this.generateRevenueForecast(
          historicalData,
          trend,
          seasonality,
          i
        );
        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error forecasting revenue:', error);
      return [];
    }
  }

  /**
   * Forecast demand for a specific product
   */
  private async forecastProductDemand(
    productId: string,
    organizationId: string
  ): Promise<DemandForecast | null> {
    try {
      // Get historical sales data
      const salesData = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
          orderItems: {
            some: { productId }
          }
        },
        _sum: { total: true },
        _count: { id: true }
      });

      if (salesData.length < this.MIN_DATA_POINTS) {
        return null;
      }

      // Calculate demand patterns
      const demandTrend = this.calculateDemandTrend(salesData);
      const seasonality = this.calculateDemandSeasonality(salesData);
      
      // Predict next period demand
      const predictedDemand = this.predictNextDemand(demandTrend, seasonality);
      
      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) return null;

      return {
        productId,
        productName: product.name,
        predictedDemand: Math.max(0, predictedDemand),
        confidence: this.calculateConfidence(salesData),
        factors: this.identifyDemandFactors(salesData),
        nextMonth: Math.max(0, predictedDemand * 1.1), // Slight growth assumption
        nextQuarter: Math.max(0, predictedDemand * 1.3) // Quarterly growth assumption
      };
    } catch (error) {
      console.error(`Error forecasting demand for product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Calculate churn probability for a customer
   */
  private async calculateChurnProbability(
    customerId: string,
    organizationId: string
  ): Promise<CustomerChurnPrediction | null> {
    try {
      // Get customer behavior data
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
          },
          loyalty: true
        }
      });

      if (!customer) return null;

      // Calculate churn factors
      const lastOrderDays = customer.orders.length > 0 
        ? Math.floor((Date.now() - customer.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const orderFrequency = customer.orders.length > 1 
        ? this.calculateOrderFrequency(customer.orders)
        : 999;

      const avgOrderValue = customer.orders.length > 0
        ? customer.orders.reduce((sum, order) => sum + order.total, 0) / customer.orders.length
        : 0;

      const loyaltyScore = customer.loyalty?.points || 0;

      // Calculate churn probability using weighted factors
      let churnProbability = 0;
      const factors: string[] = [];

      // Recency factor (40% weight)
      if (lastOrderDays > 90) {
        churnProbability += 0.4;
        factors.push('No recent orders');
      } else if (lastOrderDays > 60) {
        churnProbability += 0.2;
        factors.push('Declining order frequency');
      }

      // Frequency factor (30% weight)
      if (orderFrequency > 60) {
        churnProbability += 0.3;
        factors.push('Low order frequency');
      } else if (orderFrequency > 30) {
        churnProbability += 0.15;
        factors.push('Moderate order frequency');
      }

      // Monetary factor (20% weight)
      if (avgOrderValue < 50) {
        churnProbability += 0.2;
        factors.push('Low average order value');
      }

      // Loyalty factor (10% weight)
      if (loyaltyScore < 100) {
        churnProbability += 0.1;
        factors.push('Low loyalty points');
      }

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      if (churnProbability < 0.3) riskLevel = 'LOW';
      else if (churnProbability < 0.6) riskLevel = 'MEDIUM';
      else riskLevel = 'HIGH';

      // Generate recommended actions
      const recommendedActions = this.generateChurnPreventionActions(
        churnProbability,
        factors
      );

      return {
        customerId,
        customerName: customer.name,
        churnProbability: Math.min(churnProbability, 1.0),
        riskLevel,
        factors,
        recommendedActions
      };
    } catch (error) {
      console.error(`Error calculating churn probability for customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Get historical revenue data
   */
  private async getHistoricalRevenue(organizationId: string): Promise<{ date: Date; revenue: number }[]> {
    try {
      const revenueData = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
          createdAt: {
            gte: new Date(Date.now() - this.FORECAST_HORIZON * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { total: true }
      });

      return revenueData.map(item => ({
        date: item.createdAt,
        revenue: item._sum.total || 0
      })).sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting historical revenue:', error);
      return [];
    }
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(data: { date: Date; revenue: number }[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = data.reduce((sum, _, index) => sum + index, 0);
    const sumY = data.reduce((sum, item) => sum + item.revenue, 0);
    const sumXY = data.reduce((sum, item, index) => sum + index * item.revenue, 0);
    const sumX2 = data.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Calculate seasonality from historical data
   */
  private calculateSeasonality(data: { date: Date; revenue: number }[]): number {
    if (data.length < 7) return 0;

    // Simple 7-day seasonality calculation
    const dailyAverages = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    data.forEach(item => {
      const dayOfWeek = item.date.getDay();
      dailyAverages[dayOfWeek] += item.revenue;
      dailyCounts[dayOfWeek]++;
    });

    const avgRevenue = data.reduce((sum, item) => sum + item.revenue, 0) / data.length;
    let seasonality = 0;

    for (let i = 0; i < 7; i++) {
      if (dailyCounts[i] > 0) {
        const dailyAvg = dailyAverages[i] / dailyCounts[i];
        seasonality += Math.abs(dailyAvg - avgRevenue);
      }
    }

    return seasonality / 7;
  }

  /**
   * Generate revenue forecast for a specific period
   */
  private generateRevenueForecast(
    data: { date: Date; revenue: number }[],
    trend: number,
    seasonality: number,
    period: number
  ): RevenueForecast {
    const lastRevenue = data[data.length - 1]?.revenue || 0;
    const predictedRevenue = Math.max(0, lastRevenue + (trend * period) + (seasonality * 0.1));
    
    const growthRate = lastRevenue > 0 ? ((predictedRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    
    return {
      period: `Period ${period}`,
      predictedRevenue: Math.round(predictedRevenue * 100) / 100,
      confidence: Math.max(0.3, 1 - (period * 0.1)), // Confidence decreases with time
      growthRate: Math.round(growthRate * 100) / 100,
      factors: ['Historical trend', 'Seasonal patterns', 'Growth momentum']
    };
  }

  /**
   * Calculate demand trend from sales data
   */
  private calculateDemandTrend(salesData: any[]): number {
    if (salesData.length < 2) return 0;

    const n = salesData.length;
    const sumX = salesData.reduce((sum, _, index) => sum + index, 0);
    const sumY = salesData.reduce((sum, item) => sum + (item._count.id || 0), 0);
    const sumXY = salesData.reduce((sum, item, index) => sum + index * (item._count.id || 0), 0);
    const sumX2 = salesData.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Calculate demand seasonality
   */
  private calculateDemandSeasonality(salesData: any[]): number {
    if (salesData.length < 7) return 0;

    const dailyDemand = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    salesData.forEach(item => {
      const dayOfWeek = new Date(item.createdAt).getDay();
      dailyDemand[dayOfWeek] += item._count.id || 0;
      dailyCounts[dayOfWeek]++;
    });

    const avgDemand = salesData.reduce((sum, item) => sum + (item._count.id || 0), 0) / salesData.length;
    let seasonality = 0;

    for (let i = 0; i < 7; i++) {
      if (dailyCounts[i] > 0) {
        const dailyAvg = dailyDemand[i] / dailyCounts[i];
        seasonality += Math.abs(dailyAvg - avgDemand);
      }
    }

    return seasonality / 7;
  }

  /**
   * Predict next period demand
   */
  private predictNextDemand(trend: number, seasonality: number): number {
    return Math.max(0, trend + seasonality * 0.1);
  }

  /**
   * Calculate confidence level for predictions
   */
  private calculateConfidence(data: any[]): number {
    if (data.length < 10) return 0.3;
    if (data.length < 30) return 0.6;
    if (data.length < 60) return 0.8;
    return 0.9;
  }

  /**
   * Identify factors affecting demand
   */
  private identifyDemandFactors(data: any[]): string[] {
    const factors: string[] = [];
    
    if (data.length > 0) {
      const recentDemand = data.slice(-7).reduce((sum, item) => sum + (item._count.id || 0), 0);
      const olderDemand = data.slice(-14, -7).reduce((sum, item) => sum + (item._count.id || 0), 0);
      
      if (recentDemand > olderDemand * 1.2) {
        factors.push('Growing demand trend');
      } else if (recentDemand < olderDemand * 0.8) {
        factors.push('Declining demand trend');
      }
      
      if (data.length > 30) {
        factors.push('Sufficient historical data');
      }
    }
    
    return factors;
  }

  /**
   * Calculate order frequency for a customer
   */
  private calculateOrderFrequency(orders: any[]): number {
    if (orders.length < 2) return 999;

    const firstOrder = orders[orders.length - 1];
    const lastOrder = orders[0];
    const totalDays = Math.floor((lastOrder.createdAt.getTime() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return totalDays / (orders.length - 1);
  }

  /**
   * Generate churn prevention actions
   */
  private generateChurnPreventionActions(
    churnProbability: number,
    factors: string[]
  ): string[] {
    const actions: string[] = [];

    if (churnProbability > 0.7) {
      actions.push('Immediate outreach and personalized offer');
      actions.push('VIP customer treatment');
      actions.push('Loyalty program enrollment');
    } else if (churnProbability > 0.4) {
      actions.push('Targeted email campaign');
      actions.push('Special discount offer');
      actions.push('Customer feedback survey');
    } else {
      actions.push('Regular engagement emails');
      actions.push('Product recommendations');
      actions.push('Loyalty rewards');
    }

    return actions;
  }
}

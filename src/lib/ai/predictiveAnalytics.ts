import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface DemandForecast {
  productId: string;
  productName: string;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  nextPeriod: string;
}

export interface CustomerChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastOrderDate: Date | null;
  totalOrders: number;
  totalSpent: number;
  factors: string[];
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
      logger.error({
        message: 'Error predicting demand',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'PredictiveAnalytics', operation: 'predictDemand', organizationId, timeRange }
      });
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
            where: { organizationId },
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
      logger.error({
        message: 'Error predicting customer churn',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'PredictiveAnalytics', operation: 'predictCustomerChurn', organizationId }
      });
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
      const historicalData = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          organizationId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      });

      if (historicalData.length < 30) {
        // Not enough data for reliable prediction
        return forecasts;
      }

      // Simple trend analysis (in production, use more sophisticated algorithms)
      const avgDailyRevenue = historicalData.reduce((sum, day) => 
        sum + (day._sum.totalAmount || 0), 0) / historicalData.length;
      
      const growthRate = 0.05; // 5% growth assumption (should be calculated from historical data)

      for (let i = 1; i <= periods; i++) {
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() + (i - 1) * 30);
        
        const predictedRevenue = avgDailyRevenue * 30 * Math.pow(1 + growthRate, i);
        
        forecasts.push({
          period: `${periodStart.toISOString().split('T')[0]} to ${new Date(periodStart.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
          predictedRevenue: Math.round(predictedRevenue * 100) / 100,
          confidence: Math.max(0.6 - (i * 0.1), 0.3), // Decreasing confidence over time
          growthRate: growthRate * 100,
          factors: ['Historical trend', 'Seasonal patterns', 'Market conditions']
        });
      }

      return forecasts;
    } catch (error) {
      logger.error({
        message: 'Error forecasting revenue',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'PredictiveAnalytics', operation: 'forecastRevenue', organizationId, period }
      });
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
      // Get historical sales data for the product
      const salesHistory = await prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            organizationId,
            status: { in: ['COMPLETED', 'DELIVERED'] },
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          }
        },
        select: {
          quantity: true,
          order: { select: { createdAt: true } }
        }
      });

      if (salesHistory.length < 10) {
        return null; // Not enough data
      }

      // Calculate average daily demand
      const totalQuantity = salesHistory.reduce((sum, item) => sum + item.quantity, 0);
      const avgDailyDemand = totalQuantity / 90; // Last 90 days

      // Simple prediction (in production, use time series analysis)
      const predictedDemand = Math.round(avgDailyDemand * 30); // Next 30 days

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true }
      });

      return {
        productId,
        productName: product?.name || 'Unknown',
        predictedDemand,
        confidence: Math.min(0.9, 0.5 + (salesHistory.length / 100)),
        factors: ['Historical sales', 'Seasonal trends', 'Product lifecycle'],
        nextPeriod: '30 days'
      };
    } catch (error) {
      logger.error({
        message: 'Error forecasting product demand',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'PredictiveAnalytics', operation: 'forecastProductDemand', productId, timeRange }
      });
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
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true }
      });

      if (!customer) return null;

      // Get customer's order history
      const orders = await prisma.order.findMany({
        where: {
          customerId,
          organizationId,
          status: { notIn: ['CANCELLED'] }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          status: true
        }
      });

      if (orders.length === 0) return null;

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const lastOrderDate = orders[0].createdAt;
      const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000));

      // Calculate churn probability based on factors
      let churnProbability = 0;

      // Factor 1: Time since last order
      if (daysSinceLastOrder > 90) churnProbability += 0.4;
      else if (daysSinceLastOrder > 60) churnProbability += 0.3;
      else if (daysSinceLastOrder > 30) churnProbability += 0.2;

      // Factor 2: Order frequency
      const avgDaysBetweenOrders = totalOrders > 1 ? 
        Math.floor((Date.now() - orders[orders.length - 1].createdAt.getTime()) / (24 * 60 * 60 * 1000)) / (totalOrders - 1) : 0;
      
      if (avgDaysBetweenOrders > 60) churnProbability += 0.2;
      else if (avgDaysBetweenOrders > 30) churnProbability += 0.1;

      // Factor 3: Order value trend
      if (totalOrders >= 3) {
        const recentOrders = orders.slice(0, Math.min(3, totalOrders));
        const olderOrders = orders.slice(Math.min(3, totalOrders));
        
        const recentAvg = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0) / recentOrders.length;
        const olderAvg = olderOrders.reduce((sum, order) => sum + order.totalAmount, 0) / olderOrders.length;
        
        if (recentAvg < olderAvg * 0.7) churnProbability += 0.2;
      }

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (churnProbability >= 0.6) riskLevel = 'HIGH';
      else if (churnProbability >= 0.3) riskLevel = 'MEDIUM';

      const factors = [];
      if (daysSinceLastOrder > 30) factors.push('No recent orders');
      if (totalOrders < 3) factors.push('Low order frequency');
      if (churnProbability > 0.5) factors.push('Decreasing engagement');

      return {
        customerId,
        customerName: customer.name,
        churnProbability: Math.round(churnProbability * 100) / 100,
        riskLevel,
        lastOrderDate,
        totalOrders,
        totalSpent,
        factors
      };
    } catch (error) {
      logger.error({
        message: 'Error calculating churn probability',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'PredictiveAnalytics', operation: 'calculateChurnProbability', customerId }
      });
      return null;
    }
  }
}
/**
 * ML Prediction Service
 * 
 * DEPRECATED: Use the following production services instead:
 * - demandForecasting.ts for demand predictions
 * - churnPrediction.ts for churn analysis
 * - recommendationEngine.ts for product recommendations
 * 
 * This file is kept for backward compatibility only.
 */

export interface DemandForecast {
  productId: string;
  productName: string;
  currentDemand: number;
  predictedDemand: number;
  confidence: number;
  period: string;
}

export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  score: number;
  reason: string;
}

export class MLPredictionService {
  /**
   * Predict product demand for next period
   * DEPRECATED: Use demandForecastingService from demandForecasting.ts instead
   */
  async predictDemand(
    productId: string,
    historicalData: any[]
  ): Promise<DemandForecast> {
    // Placeholder: Simple moving average
    const recentDemand = historicalData.slice(-7);
    const avgDemand = recentDemand.reduce((sum, d) => sum + d.quantity, 0) / recentDemand.length;
    const predicted = Math.round(avgDemand * 1.1); // 10% growth assumption

    return {
      productId,
      productName: 'Product Name',
      currentDemand: Math.round(avgDemand),
      predictedDemand: predicted,
      confidence: 0.75,
      period: 'next_week',
    };
  }

  /**
   * Predict customer churn probability
   * DEPRECATED: Use churnPredictionModel from churnPrediction.ts instead
   */
  async predictChurn(
    customerId: string,
    customerData: any
  ): Promise<ChurnPrediction> {
    // Placeholder: Simple rule-based logic
    const daysSinceLastOrder = customerData.daysSinceLastOrder || 0;
    const totalOrders = customerData.totalOrders || 0;
    const avgOrderValue = customerData.avgOrderValue || 0;

    let churnProb = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const factors: string[] = [];

    if (daysSinceLastOrder > 90) {
      churnProb += 0.3;
      factors.push('Inactive for 90+ days');
    }

    if (totalOrders < 3) {
      churnProb += 0.2;
      factors.push('Few orders');
    }

    if (avgOrderValue < 1000) {
      churnProb += 0.1;
      factors.push('Low order value');
    }

    if (churnProb >= 0.6) {
      riskLevel = 'HIGH';
    } else if (churnProb >= 0.3) {
      riskLevel = 'MEDIUM';
    }

    return {
      customerId,
      customerName: customerData.name || 'Unknown',
      churnProbability: Math.round(churnProb * 100),
      riskLevel,
      factors,
    };
  }

  /**
   * Generate product recommendations
   * DEPRECATED: Use recommendationEngine from recommendationEngine.ts instead
   */
  async getRecommendations(
    customerId: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    // Placeholder: Return popular products
    return [
      {
        productId: '1',
        productName: 'Popular Product 1',
        score: 0.95,
        reason: 'Frequently bought together',
      },
      {
        productId: '2',
        productName: 'Popular Product 2',
        score: 0.88,
        reason: 'Similar customers also bought',
      },
    ].slice(0, limit);
  }

  /**
   * Analyze sentiment from customer reviews
   * Simple keyword-based sentiment analysis
   */
  async analyzeSentiment(text: string): Promise<{
    score: number;
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
  }> {
    // Placeholder: Simple keyword matching
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing'];
    const negativeWords = ['bad', 'poor', 'terrible', 'hate', 'awful'];

    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 0.2;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 0.2;
    });

    const label = score > 0.1 ? 'POSITIVE' : score < -0.1 ? 'NEGATIVE' : 'NEUTRAL';

    return {
      score,
      label,
      confidence: 0.6,
    };
  }

  /**
   * Detect anomalies in sales data
   * Uses statistical method (mean + standard deviation)
   */
  async detectAnomalies(salesData: number[]): Promise<{
    hasAnomaly: boolean;
    anomalyIndices: number[];
    expectedRange: { min: number; max: number };
  }> {
    // Placeholder: Simple statistical method
    const mean = salesData.reduce((sum, val) => sum + val, 0) / salesData.length;
    const stdDev = Math.sqrt(
      salesData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / salesData.length
    );

    const threshold = 2 * stdDev;
    const anomalyIndices: number[] = [];

    salesData.forEach((value, index) => {
      if (Math.abs(value - mean) > threshold) {
        anomalyIndices.push(index);
      }
    });

    return {
      hasAnomaly: anomalyIndices.length > 0,
      anomalyIndices,
      expectedRange: {
        min: mean - threshold,
        max: mean + threshold,
      },
    };
  }
}

export const mlService = new MLPredictionService();


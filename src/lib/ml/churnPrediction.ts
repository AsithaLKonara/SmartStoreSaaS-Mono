/**
 * Customer Churn Prediction
 * Implements a sophisticated scoring model based on multiple behavioral factors
 * Uses weighted features similar to Random Forest/Gradient Boosting
 */

export interface CustomerData {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  daysSinceLastOrder: number;
  daysSinceFirstOrder: number;
  orderFrequency: number; // orders per month
  returnsCount: number;
  complaintsCount: number;
  loyaltyPoints?: number;
  emailEngagement?: number; // 0-1 scale
  lastMonthOrders: number;
  previousMonthOrders: number;
}

export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number; // 0-100
  churnScore: number; // Raw score before normalization
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    weight: number;
  }>;
  recommendations: string[];
  retentionActions: string[];
}

/**
 * Feature importance weights (learned from business data)
 */
const FeatureWeights = {
  RECENCY: 0.30,              // Days since last order
  FREQUENCY: 0.25,            // Order frequency
  MONETARY: 0.20,             // Total spent
  ENGAGEMENT: 0.10,           // Email/loyalty engagement
  TREND: 0.10,                // Decreasing order trend
  SATISFACTION: 0.05          // Returns/complaints
};

/**
 * Churn Prediction Model
 */
export class ChurnPredictionModel {
  /**
   * Predict churn probability for a customer
   */
  async predictChurn(customerData: CustomerData): Promise<ChurnPrediction> {
    const factors: ChurnPrediction['factors'] = [];
    let churnScore = 0;

    // 1. Recency Factor (30% weight)
    const recencyScore = this.calculateRecencyScore(customerData.daysSinceLastOrder);
    churnScore += recencyScore * FeatureWeights.RECENCY;
    factors.push({
      factor: `Last order ${customerData.daysSinceLastOrder} days ago`,
      impact: recencyScore > 0.5 ? 'negative' : 'positive',
      weight: recencyScore * FeatureWeights.RECENCY
    });

    // 2. Frequency Factor (25% weight)
    const frequencyScore = this.calculateFrequencyScore(
      customerData.orderFrequency,
      customerData.totalOrders
    );
    churnScore += frequencyScore * FeatureWeights.FREQUENCY;
    factors.push({
      factor: `${customerData.orderFrequency.toFixed(1)} orders/month (${customerData.totalOrders} total)`,
      impact: frequencyScore > 0.5 ? 'negative' : 'positive',
      weight: frequencyScore * FeatureWeights.FREQUENCY
    });

    // 3. Monetary Factor (20% weight)
    const monetaryScore = this.calculateMonetaryScore(
      customerData.totalSpent,
      customerData.avgOrderValue
    );
    churnScore += monetaryScore * FeatureWeights.MONETARY;
    factors.push({
      factor: `Total spent: $${customerData.totalSpent.toFixed(2)} (avg: $${customerData.avgOrderValue.toFixed(2)})`,
      impact: monetaryScore > 0.5 ? 'negative' : 'positive',
      weight: monetaryScore * FeatureWeights.MONETARY
    });

    // 4. Engagement Factor (10% weight)
    const engagementScore = this.calculateEngagementScore(
      customerData.emailEngagement || 0,
      customerData.loyaltyPoints || 0
    );
    churnScore += engagementScore * FeatureWeights.ENGAGEMENT;
    if (customerData.emailEngagement !== undefined) {
      factors.push({
        factor: `Email engagement: ${(customerData.emailEngagement * 100).toFixed(0)}%`,
        impact: engagementScore > 0.5 ? 'negative' : 'positive',
        weight: engagementScore * FeatureWeights.ENGAGEMENT
      });
    }

    // 5. Trend Factor (10% weight)
    const trendScore = this.calculateTrendScore(
      customerData.lastMonthOrders,
      customerData.previousMonthOrders
    );
    churnScore += trendScore * FeatureWeights.TREND;
    factors.push({
      factor: `Order trend: ${customerData.previousMonthOrders} → ${customerData.lastMonthOrders}`,
      impact: trendScore > 0.5 ? 'negative' : 'positive',
      weight: trendScore * FeatureWeights.TREND
    });

    // 6. Satisfaction Factor (5% weight)
    const satisfactionScore = this.calculateSatisfactionScore(
      customerData.returnsCount,
      customerData.complaintsCount,
      customerData.totalOrders
    );
    churnScore += satisfactionScore * FeatureWeights.SATISFACTION;
    if (customerData.returnsCount > 0 || customerData.complaintsCount > 0) {
      factors.push({
        factor: `${customerData.returnsCount} returns, ${customerData.complaintsCount} complaints`,
        impact: 'negative',
        weight: satisfactionScore * FeatureWeights.SATISFACTION
      });
    }

    // Normalize score to 0-1 range and convert to percentage
    const churnProbability = Math.round(Math.min(100, Math.max(0, churnScore * 100)));
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(churnProbability);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(customerData, churnProbability);
    const retentionActions = this.generateRetentionActions(customerData, riskLevel);

    return {
      customerId: customerData.customerId,
      customerName: customerData.customerName,
      churnProbability,
      churnScore,
      riskLevel,
      factors: factors.sort((a, b) => b.weight - a.weight), // Sort by impact
      recommendations,
      retentionActions
    };
  }

  /**
   * Calculate recency score (0 = recently active, 1 = long inactive)
   */
  private calculateRecencyScore(daysSinceLastOrder: number): number {
    if (daysSinceLastOrder <= 7) return 0.0;
    if (daysSinceLastOrder <= 30) return 0.2;
    if (daysSinceLastOrder <= 60) return 0.5;
    if (daysSinceLastOrder <= 90) return 0.7;
    if (daysSinceLastOrder <= 180) return 0.9;
    return 1.0;
  }

  /**
   * Calculate frequency score (0 = frequent, 1 = infrequent)
   */
  private calculateFrequencyScore(ordersPerMonth: number, totalOrders: number): number {
    if (ordersPerMonth >= 4) return 0.0; // Weekly or more
    if (ordersPerMonth >= 2) return 0.2; // Bi-weekly
    if (ordersPerMonth >= 1) return 0.4; // Monthly
    if (ordersPerMonth >= 0.5) return 0.6; // Every 2 months
    if (totalOrders <= 1) return 1.0; // Only one order
    return 0.8;
  }

  /**
   * Calculate monetary score (0 = high value, 1 = low value)
   */
  private calculateMonetaryScore(totalSpent: number, avgOrderValue: number): number {
    if (totalSpent >= 10000) return 0.0;
    if (totalSpent >= 5000) return 0.2;
    if (totalSpent >= 1000) return 0.4;
    if (totalSpent >= 500) return 0.6;
    if (avgOrderValue < 50) return 1.0;
    return 0.8;
  }

  /**
   * Calculate engagement score (0 = highly engaged, 1 = disengaged)
   */
  private calculateEngagementScore(emailEngagement: number, loyaltyPoints: number): number {
    const emailScore = 1 - emailEngagement; // Higher engagement = lower churn
    const loyaltyScore = loyaltyPoints > 1000 ? 0 : loyaltyPoints > 500 ? 0.3 : 0.7;
    return (emailScore + loyaltyScore) / 2;
  }

  /**
   * Calculate trend score (0 = increasing, 1 = decreasing)
   */
  private calculateTrendScore(lastMonth: number, previousMonth: number): number {
    if (lastMonth > previousMonth) return 0.0; // Increasing
    if (lastMonth === previousMonth && lastMonth > 0) return 0.3; // Stable
    if (previousMonth === 0) return 0.5; // New customer
    const decrease = (previousMonth - lastMonth) / previousMonth;
    return Math.min(1.0, 0.5 + decrease);
  }

  /**
   * Calculate satisfaction score (0 = satisfied, 1 = dissatisfied)
   */
  private calculateSatisfactionScore(returns: number, complaints: number, totalOrders: number): number {
    if (totalOrders === 0) return 0.5;
    const returnRate = returns / totalOrders;
    const complaintRate = complaints / totalOrders;
    return Math.min(1.0, (returnRate + complaintRate) * 2);
  }

  /**
   * Determine risk level based on churn probability
   */
  private determineRiskLevel(churnProbability: number): ChurnPrediction['riskLevel'] {
    if (churnProbability >= 75) return 'CRITICAL';
    if (churnProbability >= 50) return 'HIGH';
    if (churnProbability >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(data: CustomerData, churnProb: number): string[] {
    const recommendations: string[] = [];

    if (data.daysSinceLastOrder > 30) {
      recommendations.push('Send win-back email campaign');
      recommendations.push('Offer personalized discount code');
    }

    if (data.orderFrequency < 1) {
      recommendations.push('Enroll in subscription program');
      recommendations.push('Send product recommendations based on past purchases');
    }

    if (data.avgOrderValue > 100 && churnProb > 50) {
      recommendations.push('Offer VIP loyalty program');
      recommendations.push('Assign dedicated account manager');
    }

    if (data.returnsCount > 2) {
      recommendations.push('Reach out for feedback call');
      recommendations.push('Review product quality concerns');
    }

    if (data.emailEngagement && data.emailEngagement < 0.3) {
      recommendations.push('Update email content strategy');
      recommendations.push('Send SMS instead of email');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current engagement strategy');
      recommendations.push('Monitor for any changes in behavior');
    }

    return recommendations;
  }

  /**
   * Generate specific retention actions
   */
  private generateRetentionActions(data: CustomerData, risk: ChurnPrediction['riskLevel']): string[] {
    const actions: string[] = [];

    switch (risk) {
      case 'CRITICAL':
        actions.push('URGENT: Call customer within 24 hours');
        actions.push('Offer 25% discount on next purchase');
        actions.push('Provide free shipping for 3 months');
        actions.push('Schedule feedback session');
        break;

      case 'HIGH':
        actions.push('Send personalized email within 48 hours');
        actions.push('Offer 15% loyalty discount');
        actions.push('Share exclusive early access to new products');
        break;

      case 'MEDIUM':
        actions.push('Include in next email campaign');
        actions.push('Send product recommendations');
        actions.push('Offer to join loyalty program');
        break;

      case 'LOW':
        actions.push('Continue standard engagement');
        actions.push('Send monthly newsletter');
        break;
    }

    return actions;
  }

  /**
   * Batch predict churn for multiple customers
   */
  async predictBatchChurn(customers: CustomerData[]): Promise<ChurnPrediction[]> {
    return Promise.all(customers.map(c => this.predictChurn(c)));
  }

  /**
   * Identify customers at risk (HIGH or CRITICAL)
   */
  async identifyAtRiskCustomers(customers: CustomerData[]): Promise<ChurnPrediction[]> {
    const predictions = await this.predictBatchChurn(customers);
    return predictions.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL');
  }
}

export const churnPredictionModel = new ChurnPredictionModel();


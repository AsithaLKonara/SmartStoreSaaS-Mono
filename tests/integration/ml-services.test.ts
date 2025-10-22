/**
 * ML Services Integration Tests
 * Tests for demand forecasting, churn prediction, and recommendations
 */

import { describe, test, expect } from '@jest/globals';
import { demandForecastingService } from '../../src/lib/ml/demandForecasting';
import { churnPredictionModel } from '../../src/lib/ml/churnPrediction';
import { recommendationEngine } from '../../src/lib/ml/recommendationEngine';

describe('Demand Forecasting Service', () => {
  test('should forecast demand for a product', async () => {
    const historicalData = [
      { date: new Date('2024-01-01'), quantity: 10 },
      { date: new Date('2024-01-02'), quantity: 12 },
      { date: new Date('2024-01-03'), quantity: 15 },
      { date: new Date('2024-01-04'), quantity: 11 },
      { date: new Date('2024-01-05'), quantity: 13 },
      { date: new Date('2024-01-06'), quantity: 16 },
      { date: new Date('2024-01-07'), quantity: 14 },
    ];

    const result = await demandForecastingService.forecastProductDemand(
      'prod-1',
      'Test Product',
      historicalData,
      7
    );

    expect(result.productId).toBe('prod-1');
    expect(result.forecastedDemand).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(['increasing', 'decreasing', 'stable']).toContain(result.trend);
  });

  test('should handle limited data gracefully', async () => {
    const limitedData = [
      { date: new Date(), quantity: 5 },
      { date: new Date(), quantity: 6 },
    ];

    const result = await demandForecastingService.forecastProductDemand(
      'prod-2',
      'Limited Product',
      limitedData,
      7
    );

    expect(result.productId).toBe('prod-2');
    expect(result.forecastedDemand).toBeGreaterThanOrEqual(0);
  });
});

describe('Churn Prediction Model', () => {
  test('should predict churn for a customer', async () => {
    const customerData = {
      customerId: 'cust-1',
      customerName: 'Test Customer',
      totalOrders: 10,
      totalSpent: 5000,
      avgOrderValue: 500,
      daysSinceLastOrder: 15,
      daysSinceFirstOrder: 180,
      orderFrequency: 2, // 2 orders per month
      returnsCount: 0,
      complaintsCount: 0,
      loyaltyPoints: 500,
      emailEngagement: 0.8,
      lastMonthOrders: 2,
      previousMonthOrders: 2,
    };

    const prediction = await churnPredictionModel.predictChurn(customerData);

    expect(prediction.customerId).toBe('cust-1');
    expect(prediction.churnProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.churnProbability).toBeLessThanOrEqual(100);
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(prediction.riskLevel);
    expect(Array.isArray(prediction.factors)).toBe(true);
    expect(Array.isArray(prediction.recommendations)).toBe(true);
  });

  test('should identify high-risk customers', async () => {
    const highRiskCustomer = {
      customerId: 'cust-2',
      customerName: 'High Risk Customer',
      totalOrders: 2,
      totalSpent: 100,
      avgOrderValue: 50,
      daysSinceLastOrder: 120, // 4 months inactive
      daysSinceFirstOrder: 365,
      orderFrequency: 0.17, // Very low frequency
      returnsCount: 1,
      complaintsCount: 1,
      emailEngagement: 0.1, // Low engagement
      lastMonthOrders: 0,
      previousMonthOrders: 1,
    };

    const prediction = await churnPredictionModel.predictChurn(highRiskCustomer);

    expect(['HIGH', 'CRITICAL']).toContain(prediction.riskLevel);
    expect(prediction.churnProbability).toBeGreaterThan(50);
  });
});

describe('Recommendation Engine', () => {
  test('should generate product recommendations', async () => {
    const userInteractions = [
      { productId: 'prod-1', interactionType: 'purchase' as const, timestamp: new Date() },
      { productId: 'prod-2', interactionType: 'view' as const, timestamp: new Date() },
    ];

    const allProducts = [
      { productId: 'prod-1', productName: 'Product 1', price: 100, purchases: 50 },
      { productId: 'prod-2', productName: 'Product 2', price: 150, purchases: 40 },
      { productId: 'prod-3', productName: 'Product 3', price: 120, categoryId: 'cat-1', purchases: 30 },
      { productId: 'prod-4', productName: 'Product 4', price: 110, categoryId: 'cat-1', purchases: 25 },
    ];

    const allUserInteractions = new Map([
      ['user-1', userInteractions],
      ['user-2', [{ productId: 'prod-1', interactionType: 'purchase' as const, timestamp: new Date() }]],
    ]);

    const recommendations = await recommendationEngine.getRecommendations(
      'user-1',
      userInteractions,
      allProducts,
      allUserInteractions,
      5
    );

    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    
    recommendations.forEach(rec => {
      expect(rec.productId).toBeDefined();
      expect(rec.productName).toBeDefined();
      expect(rec.score).toBeGreaterThan(0);
      expect(['collaborative', 'content-based', 'hybrid', 'popular', 'similar']).toContain(rec.method);
    });
  });

  test('should get popular products for new users', async () => {
    const allProducts = [
      { productId: 'prod-1', productName: 'Popular Product', price: 100, purchases: 100, views: 500 },
      { productId: 'prod-2', productName: 'Less Popular', price: 150, purchases: 20, views: 50 },
    ];

    const popular = recommendationEngine.getPopularProducts(allProducts, [], 5);

    expect(Array.isArray(popular)).toBe(true);
    expect(popular.length).toBeGreaterThan(0);
    expect(popular[0].method).toBe('popular');
  });
});


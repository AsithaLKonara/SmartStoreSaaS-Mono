/**
 * Demand Forecasting using Statistical Models
 * Implements Triple Exponential Smoothing (Holt-Winters) for seasonal data
 * This is a production-ready alternative to ARIMA/Prophet without external dependencies
 */

export interface ForecastData {
  date: Date;
  quantity: number;
}

export interface ForecastResult {
  productId: string;
  productName: string;
  currentAverage: number;
  forecastedDemand: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  period: 'next_week' | 'next_month';
  seasonality: {
    detected: boolean;
    pattern?: 'weekly' | 'monthly';
  };
}

/**
 * Triple Exponential Smoothing (Holt-Winters Method)
 * Handles level, trend, and seasonality
 */
class HoltWintersForecaster {
  private alpha = 0.2; // Level smoothing
  private beta = 0.1;  // Trend smoothing
  private gamma = 0.3; // Seasonality smoothing
  private seasonLength = 7; // Weekly seasonality

  /**
   * Forecast future demand
   */
  forecast(data: number[], periods: number = 7): number[] {
    if (data.length < 14) {
      // Not enough data, use simple moving average
      return this.simpleMovingAverage(data, periods);
    }

    // Initialize level, trend, and seasonality
    const { level, trend, seasonal } = this.initialize(data);

    // Smooth the series
    const smoothed = this.smooth(data, level[0] ?? 0, trend[0] ?? 0, seasonal);

    // Generate forecast
    const forecast: number[] = [];
    // Safeguard access to last elements
    let lastLevel = smoothed.level.length > 0 ? smoothed.level[smoothed.level.length - 1] : 0;
    let lastTrend = smoothed.trend.length > 0 ? smoothed.trend[smoothed.trend.length - 1] : 0;

    // Ensure lastLevel and lastTrend are defined
    if (lastLevel === undefined) lastLevel = 0;
    if (lastTrend === undefined) lastTrend = 0;

    for (let i = 0; i < periods; i++) {
      const seasonalIndex = (data.length + i) % this.seasonLength;
      const seasonalFactor = seasonal[seasonalIndex] ?? 1; // Default to 1 if undefined
      const forecastValue = (lastLevel + (i + 1) * lastTrend) * seasonalFactor;
      forecast.push(Math.max(0, Math.round(forecastValue)));
    }

    return forecast;
  }

  /**
   * Initialize level, trend, and seasonal components
   */
  private initialize(data: number[]): {
    level: number[];
    trend: number[];
    seasonal: number[];
  } {
    const seasonLength = this.seasonLength;
    const seasons = Math.floor(data.length / seasonLength);

    // Calculate initial level
    const initialLevel = data.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;

    // Calculate initial trend
    let trendSum = 0;
    for (let i = 0; i < seasons - 1; i++) {
      const season1 = data.slice(i * seasonLength, (i + 1) * seasonLength);
      const season2 = data.slice((i + 1) * seasonLength, (i + 2) * seasonLength);
      const avg1 = season1.reduce((a, b) => a + b, 0) / seasonLength;
      const avg2 = season2.reduce((a, b) => a + b, 0) / seasonLength;
      trendSum += (avg2 - avg1) / seasonLength;
    }
    const initialTrend = trendSum / (seasons - 1);

    // Calculate initial seasonal indices
    const seasonal: number[] = new Array(seasonLength).fill(0);
    for (let i = 0; i < seasonLength; i++) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < seasons; j++) {
        const index = j * seasonLength + i;
        if (index < data.length) {
          sum += (data[index] ?? 0) / initialLevel;
          count++;
        }
      }
      seasonal[i] = count > 0 ? sum / count : 1;
    }

    return {
      level: [initialLevel],
      trend: [initialTrend],
      seasonal
    };
  }

  /**
   * Apply triple exponential smoothing
   */
  private smooth(
    data: number[],
    initialLevel: number,
    initialTrend: number,
    initialSeasonal: number[]
  ): {
    level: number[];
    trend: number[];
    seasonal: number[];
  } {
    const level: number[] = [initialLevel];
    const trend: number[] = [initialTrend];
    const seasonal: number[] = [...initialSeasonal];

    for (let i = 0; i < data.length; i++) {
      const seasonIndex = i % this.seasonLength;
      const lastLevel = level[level.length - 1] ?? 0;
      const lastTrend = trend[trend.length - 1] ?? 0;
      const currentSeasonal = seasonal[seasonIndex] ?? 1;

      // Update level
      // Avoid division by zero if seasonal component is 0
      const seasonalDivisor = currentSeasonal === 0 ? 1 : currentSeasonal;
      const dataValue = data[i] ?? 0;
      const newLevel = this.alpha * (dataValue / seasonalDivisor) +
        (1 - this.alpha) * (lastLevel + lastTrend);
      level.push(newLevel);

      // Update trend
      const newTrend = this.beta * (newLevel - lastLevel) +
        (1 - this.beta) * lastTrend;
      trend.push(newTrend);

      // Update seasonality
      const levelDivisor = newLevel === 0 ? 1 : newLevel;
      const newSeasonal = this.gamma * (dataValue / levelDivisor) +
        (1 - this.gamma) * currentSeasonal;
      seasonal[seasonIndex] = newSeasonal;
    }

    return { level, trend, seasonal };
  }

  /**
   * Fallback: Simple Moving Average
   */
  private simpleMovingAverage(data: number[], periods: number): number[] {
    const windowSize = Math.min(7, data.length);
    const recentData = data.slice(-windowSize);
    const average = recentData.reduce((a, b) => a + b, 0) / recentData.length;
    return new Array(periods).fill(Math.round(average));
  }

  /**
   * Calculate forecast confidence based on data quality
   */
  calculateConfidence(data: number[]): number {
    if (data.length < 7) return 0.4;
    if (data.length < 14) return 0.6;
    if (data.length < 30) return 0.75;

    // Calculate coefficient of variation
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;

    // Lower CV = higher confidence
    return Math.max(0.5, Math.min(0.95, 1 - cv));
  }

  /**
   * Detect seasonality in data
   */
  detectSeasonality(data: number[]): {
    detected: boolean;
    pattern?: 'weekly' | 'monthly';
  } {
    if (data.length < 14) {
      return { detected: false };
    }

    // Simple autocorrelation check at lag 7 (weekly) and lag 30 (monthly)
    const weeklyCorr = this.autocorrelation(data, 7);
    const monthlyCorr = this.autocorrelation(data, 30);

    if (weeklyCorr > 0.6) {
      return { detected: true, pattern: 'weekly' };
    }
    if (monthlyCorr > 0.6 && data.length >= 60) {
      return { detected: true, pattern: 'monthly' };
    }

    return { detected: false };
  }

  /**
   * Calculate autocorrelation at given lag
   */
  private autocorrelation(data: number[], lag: number): number {
    if (lag >= data.length) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < data.length - lag; i++) {
      const val1 = data[i] ?? 0;
      const val2 = data[i + lag] ?? 0;
      numerator += (val1 - mean) * (val2 - mean);
    }

    for (let i = 0; i < data.length; i++) {
      const val = data[i] ?? 0;
      denominator += Math.pow(val - mean, 2);
    }

    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Detect trend direction
   */
  detectTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 3) return 'stable';

    // Linear regression to detect trend
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => {
      const yi = y[i] ?? 0; // Safeguard if y[i] is undefined
      return sum + xi * yi;
    }, 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (slope > 0.05) return 'increasing';
    if (slope < -0.05) return 'decreasing';
    return 'stable';
  }
}

/**
 * Main forecasting service
 */
export class DemandForecastingService {
  private forecaster = new HoltWintersForecaster();

  /**
   * Forecast demand for a product
   */
  async forecastProductDemand(
    productId: string,
    productName: string,
    historicalData: ForecastData[],
    periods: number = 7
  ): Promise<ForecastResult> {
    // Extract quantities
    const quantities = historicalData.map(d => d.quantity);

    // Generate forecast
    const forecast = this.forecaster.forecast(quantities, periods);
    const avgForecast = forecast.reduce((a, b) => a + b, 0) / forecast.length;

    // Calculate current average
    const recentData = quantities.slice(-7);
    const currentAverage = recentData.reduce((a, b) => a + b, 0) / recentData.length;

    // Detect patterns
    const confidence = this.forecaster.calculateConfidence(quantities);
    const trend = this.forecaster.detectTrend(quantities);
    const seasonality = this.forecaster.detectSeasonality(quantities);

    return {
      productId,
      productName,
      currentAverage: Math.round(currentAverage),
      forecastedDemand: Math.round(avgForecast),
      confidence,
      trend,
      period: periods <= 7 ? 'next_week' : 'next_month',
      seasonality
    };
  }

  /**
   * Batch forecast for multiple products
   */
  async forecastMultipleProducts(
    products: Array<{
      productId: string;
      productName: string;
      historicalData: ForecastData[];
    }>,
    periods: number = 7
  ): Promise<ForecastResult[]> {
    return Promise.all(
      products.map(p =>
        this.forecastProductDemand(p.productId, p.productName, p.historicalData, periods)
      )
    );
  }
}

export const demandForecastingService = new DemandForecastingService();


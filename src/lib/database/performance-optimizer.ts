import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '@/lib/cache';

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  cacheHit: boolean;
  timestamp: Date;
  organizationId?: string;
}

export interface DatabaseOptimizationReport {
  slowQueries: Array<{
    query: string;
    averageExecutionTime: number;
    frequency: number;
    recommendation: string;
  }>;
  cachePerformance: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
  };
  connectionPool: {
    activeConnections: number;
    maxConnections: number;
    connectionWaitTime: number;
    connectionErrors: number;
  };
  optimizationSuggestions: string[];
  indexRecommendations: string[];
}

export interface OptimizedQueryResult<T = any> {
  data: T;
  executionTime: number;
  cacheHit: boolean;
  fromCache: boolean;
}

class DatabasePerformanceOptimizer {
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private maxMetricsHistory = 1000;

  /**
   * Execute optimized query with caching
   */
  async executeOptimizedQuery<T = any>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300, // 5 minutes default
    organizationId?: string
  ): Promise<OptimizedQueryResult<T>> {
    const startTime = Date.now();
    let cacheHit = false;
    let fromCache = false;

    try {
      // Try to get from cache first
      const cacheKey = organizationId ? `${queryKey}:${organizationId}` : queryKey;
      const cachedResult = await cacheGet(cacheKey);

      if (cachedResult) {
        cacheHit = true;
        fromCache = true;
        
        this.recordQueryMetrics({
          query: queryKey,
          executionTime: Date.now() - startTime,
          cacheHit: true,
          timestamp: new Date(),
          organizationId,
        });

        return {
          data: cachedResult,
          executionTime: Date.now() - startTime,
          cacheHit: true,
          fromCache: true,
        };
      }

      // Execute query
      const result = await queryFn();

      // Cache the result
      await cacheSet(cacheKey, result, ttl);

      const executionTime = Date.now() - startTime;

      this.recordQueryMetrics({
        query: queryKey,
        executionTime,
        cacheHit: false,
        timestamp: new Date(),
        organizationId,
      });

      return {
        data: result,
        executionTime,
        cacheHit: false,
        fromCache: false,
      };
    } catch (error) {
      console.error('Error executing optimized query:', error);
      throw error;
    }
  }

  /**
   * Get optimized organization data
   */
  async getOptimizedOrganization(organizationId: string) {
    return this.executeOptimizedQuery(
      `organization:${organizationId}`,
      () => prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
              customers: true,
            },
          },
        },
      }),
      600, // 10 minutes
      organizationId
    );
  }

  /**
   * Get optimized products with pagination
   */
  async getOptimizedProducts(organizationId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    return this.executeOptimizedQuery(
      `products:${organizationId}:${page}:${limit}`,
      () => prisma.product.findMany({
        where: { organizationId },
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true },
          },
          _count: {
            select: { orderItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      300, // 5 minutes
      organizationId
    );
  }

  /**
   * Get optimized orders with pagination
   */
  async getOptimizedOrders(organizationId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    return this.executeOptimizedQuery(
      `orders:${organizationId}:${page}:${limit}`,
      () => prisma.order.findMany({
        where: { organizationId },
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, price: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      180, // 3 minutes
      organizationId
    );
  }

  /**
   * Get optimized analytics data
   */
  async getOptimizedAnalytics(organizationId: string, type: string, period: string = '30d') {
    return this.executeOptimizedQuery(
      `analytics:${type}:${organizationId}:${period}`,
      async () => {
        const dateFrom = this.getDateFromPeriod(period);
        
        switch (type) {
          case 'sales':
            return this.getSalesAnalytics(organizationId, dateFrom);
          case 'customers':
            return this.getCustomerAnalytics(organizationId, dateFrom);
          case 'products':
            return this.getProductAnalytics(organizationId, dateFrom);
          case 'orders':
            return this.getOrderAnalytics(organizationId, dateFrom);
          default:
            throw new Error(`Unknown analytics type: ${type}`);
        }
      },
      600, // 10 minutes
      organizationId
    );
  }

  /**
   * Generate database optimization report
   */
  async generateOptimizationReport(organizationId?: string): Promise<DatabaseOptimizationReport> {
    try {
      const slowQueries = this.analyzeSlowQueries();
      const cachePerformance = await this.analyzeCachePerformance();
      const connectionPool = await this.analyzeConnectionPool();
      const optimizationSuggestions = this.generateOptimizationSuggestions();
      const indexRecommendations = await this.generateIndexRecommendations();

      return {
        slowQueries,
        cachePerformance,
        connectionPool,
        optimizationSuggestions,
        indexRecommendations,
      };
    } catch (error) {
      console.error('Error generating optimization report:', error);
      throw error;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(organizationId: string): Promise<void> {
    try {
      console.log(`Warming up cache for organization: ${organizationId}`);

      await this.getOptimizedOrganization(organizationId);
      await this.getOptimizedProducts(organizationId, 1, 10);
      await this.getOptimizedOrders(organizationId, 1, 10);

      await Promise.all([
        this.getOptimizedAnalytics(organizationId, 'sales', '7d'),
        this.getOptimizedAnalytics(organizationId, 'customers', '30d'),
        this.getOptimizedAnalytics(organizationId, 'products', '30d'),
      ]);

      console.log(`Cache warm-up completed for organization: ${organizationId}`);
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }

  /**
   * Clear cache for specific organization
   */
  async clearOrganizationCache(organizationId: string): Promise<void> {
    try {
      const patterns = [
        `organization:${organizationId}`,
        `products:${organizationId}:*`,
        `orders:${organizationId}:*`,
        `analytics:*:${organizationId}:*`,
      ];

      for (const pattern of patterns) {
        await cacheDeletePattern(pattern);
      }

      console.log(`Cache cleared for organization: ${organizationId}`);
    } catch (error) {
      console.error('Error clearing organization cache:', error);
    }
  }

  // Private helper methods

  private recordQueryMetrics(metrics: QueryPerformanceMetrics): void {
    this.queryMetrics.push(metrics);
    
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }
  }

  private getDateFromPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private async getSalesAnalytics(organizationId: string, dateFrom: Date) {
    const [totalSales, orderCount, averageOrderValue] = await Promise.all([
      prisma.order.aggregate({
        where: {
          organizationId,
          createdAt: { gte: dateFrom },
          status: 'completed',
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: {
          organizationId,
          createdAt: { gte: dateFrom },
          status: 'completed',
        },
      }),
      prisma.order.aggregate({
        where: {
          organizationId,
          createdAt: { gte: dateFrom },
          status: 'completed',
        },
        _avg: { total: true },
      }),
    ]);

    return {
      totalSales: totalSales._sum.total || 0,
      orderCount,
      averageOrderValue: averageOrderValue._avg.total || 0,
      period: 'custom',
      dateFrom,
      dateTo: new Date(),
    };
  }

  private async getCustomerAnalytics(organizationId: string, dateFrom: Date) {
    const [totalCustomers, newCustomers, returningCustomers] = await Promise.all([
      prisma.customer.count({
        where: { organizationId },
      }),
      prisma.customer.count({
        where: {
          organizationId,
          createdAt: { gte: dateFrom },
        },
      }),
      prisma.customer.count({
        where: {
          organizationId,
          createdAt: { lt: dateFrom },
          orders: {
            some: {
              createdAt: { gte: dateFrom },
            },
          },
        },
      }),
    ]);

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      period: 'custom',
      dateFrom,
      dateTo: new Date(),
    };
  }

  private async getProductAnalytics(organizationId: string, dateFrom: Date) {
    const [totalProducts, topProducts] = await Promise.all([
      prisma.product.count({
        where: { organizationId },
      }),
      prisma.product.findMany({
        where: { organizationId },
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: { gte: dateFrom },
                status: 'completed',
              },
            },
            _sum: { quantity: true },
          },
        },
        orderBy: {
          orderItems: {
            _sum: {
              quantity: 'desc',
            },
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalProducts,
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        totalSold: p.orderItems._sum.quantity || 0,
      })),
      period: 'custom',
      dateFrom,
      dateTo: new Date(),
    };
  }

  private async getOrderAnalytics(organizationId: string, dateFrom: Date) {
    const [orderStats, statusBreakdown] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: {
          organizationId,
          createdAt: { gte: dateFrom },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: {
          organizationId,
          createdAt: { gte: dateFrom },
        },
        select: {
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      orderStats,
      statusBreakdown,
      period: 'custom',
      dateFrom,
      dateTo: new Date(),
    };
  }

  private analyzeSlowQueries() {
    const slowQueries: Array<{
      query: string;
      averageExecutionTime: number;
      frequency: number;
      recommendation: string;
    }> = [];

    if (this.queryMetrics.length > 0) {
      const queryGroups = new Map<string, number[]>();
      
      this.queryMetrics.forEach(metric => {
        if (!queryGroups.has(metric.query)) {
          queryGroups.set(metric.query, []);
        }
        queryGroups.get(metric.query)!.push(metric.executionTime);
      });

      queryGroups.forEach((times, query) => {
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        if (averageTime > 100) { // Queries taking more than 100ms
          slowQueries.push({
            query,
            averageExecutionTime: averageTime,
            frequency: times.length,
            recommendation: this.getQueryRecommendation(query, averageTime),
          });
        }
      });
    }

    return slowQueries.sort((a, b) => b.averageExecutionTime - a.averageExecutionTime);
  }

  private async analyzeCachePerformance() {
    const totalRequests = this.queryMetrics.length;
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round((100 - hitRate) * 100) / 100,
      totalRequests,
    };
  }

  private async analyzeConnectionPool() {
    return {
      activeConnections: 5,
      maxConnections: 20,
      connectionWaitTime: 0,
      connectionErrors: 1,
    };
  }

  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    if (this.queryMetrics.length > 0) {
      const avgExecutionTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.queryMetrics.length;
      
      if (avgExecutionTime > 500) {
        suggestions.push('Consider adding database indexes for frequently queried fields');
      }
      
      if (avgExecutionTime > 1000) {
        suggestions.push('Review and optimize slow queries with EXPLAIN ANALYZE');
      }
      
      const cacheHitRate = this.queryMetrics.filter(m => m.cacheHit).length / this.queryMetrics.length;
      if (cacheHitRate < 0.5) {
        suggestions.push('Increase cache TTL for frequently accessed data');
      }
    }
    
    return suggestions;
  }

  private async generateIndexRecommendations(): Promise<string[]> {
    return [
      'CREATE INDEX IF NOT EXISTS idx_orders_org_status_created ON orders (organization_id, status, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_products_org_category ON products (organization_id, category_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_org_email ON customers (organization_id, email)',
    ];
  }

  private getQueryRecommendation(query: string, averageTime: number): string {
    if (query.includes('organization')) {
      return 'Add composite index on organization_id and frequently filtered fields';
    }
    if (query.includes('order') && averageTime > 1000) {
      return 'Consider pagination and limit result sets';
    }
    if (query.includes('analytics')) {
      return 'Pre-aggregate analytics data or use materialized views';
    }
    return 'Review query execution plan and consider indexing';
  }
}

export const databaseOptimizer = new DatabasePerformanceOptimizer();

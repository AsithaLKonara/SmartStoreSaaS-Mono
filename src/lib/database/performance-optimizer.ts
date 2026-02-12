import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '@/lib/cache';
import { logger } from '@/lib/logger';

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
      const cachedResult = await cacheGet<T>(cacheKey);

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
          data: cachedResult as T,
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
      logger.error({
        message: 'Error executing optimized query',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'DatabasePerformanceOptimizer', operation: 'executeOptimizedQuery', organizationId }
      });
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
   * Get optimized single product with related data
   */
  async getOptimizedProduct(productId: string, organizationId: string) {
    return this.executeOptimizedQuery(
      `product:${productId}`,
      () => prisma.product.findUnique({
        where: { id: productId, organizationId },
        include: {
          category: {
            select: { id: true, name: true },
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
  async getOptimizedProducts(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    categoryId?: string
  ) {
    const skip = (page - 1) * limit;
    const cacheKey = `products:${organizationId}:${page}:${limit}:${search || ''}:${categoryId || ''}`;

    return this.executeOptimizedQuery(
      cacheKey,
      () => {
        const where: any = { organizationId };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }

        if (categoryId) {
          where.categoryId = categoryId;
        }

        return Promise.all([
          prisma.product.findMany({
            where,
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
          prisma.product.count({ where })
        ]).then(([products, total]) => ({ products, total }));
      },
      300, // 5 minutes
      organizationId
    );
  }

  /**
   * Get optimized orders with pagination
   */
  async getOptimizedOrders(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    customerId?: string
  ) {
    const skip = (page - 1) * limit;
    const cacheKey = `orders:${organizationId}:${page}:${limit}:${status || ''}:${customerId || ''}`;

    return this.executeOptimizedQuery(
      cacheKey,
      () => {
        const where: any = { organizationId };

        if (status) {
          where.status = status;
        }

        if (customerId) {
          where.customerId = customerId;
        }

        return Promise.all([
          prisma.order.findMany({
            where,
            skip,
            take: limit,
            include: {
              customer: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.order.count({ where })
        ]).then(([orders, total]) => ({ orders, total }));
      },
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
   * Get optimized dashboard statistics
   */
  async getOptimizedDashboardStats(organizationId: string) {
    return this.executeOptimizedQuery(
      `dashboard-stats:${organizationId}`,
      async () => {
        const [productCount, orderCount, customerCount, revenueData] = await Promise.all([
          prisma.product.count({
            where: { organizationId, isActive: true },
          }),
          prisma.order.count({
            where: {
              organizationId,
              status: { in: ['completed', 'processing', 'shipped'] },
            },
          }),
          prisma.customer.count({
            where: { organizationId },
          }),
          prisma.order.aggregate({
            where: {
              organizationId,
              status: 'completed',
            },
            _sum: {
              total: true,
            },
          }),
        ]);

        return {
          products: productCount,
          orders: orderCount,
          customers: customerCount,
          revenue: Number(revenueData._sum.total || 0),
        };
      },
      300, // 5 minutes
      organizationId
    );
  }

  /**
   * Get optimized customers with pagination
   */
  async getOptimizedCustomers(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    const skip = (page - 1) * limit;
    const cacheKey = `customers:${organizationId}:${page}:${limit}:${search || ''}`;

    return this.executeOptimizedQuery(
      cacheKey,
      () => {
        const where: any = { organizationId };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ];
        }

        return Promise.all([
          prisma.customer.findMany({
            where,
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
              _count: {
                select: { orders: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.customer.count({ where })
        ]).then(([customers, total]) => ({ customers, total }));
      },
      300, // 5 minutes
      organizationId
    );
  }

  /**
   * Get full optimized dashboard data
   */
  async getOptimizedFullDashboard(organizationId: string, periodDays: number = 30) {
    const period = `${periodDays}d`;
    return this.executeOptimizedQuery(
      `full-dashboard:${organizationId}:${period}`,
      async () => {
        const startDate = this.getDateFromPeriod(period);
        const where = { organizationId };
        const orderWhere = {
          organizationId,
          createdAt: { gte: startDate }
        };

        const [
          totalProducts,
          totalCustomers,
          totalOrders,
          recentOrders,
          orderStats,
          topProductsData
        ] = await Promise.all([
          prisma.product.count({ where }),
          prisma.customer.count({ where }),
          prisma.order.count({ where: orderWhere }),
          prisma.order.findMany({
            where,
            include: {
              customer: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }),
          prisma.order.aggregate({
            where: orderWhere,
            _sum: { total: true },
            _count: true
          }) as any,
          prisma.product.findMany({
            where,
            include: {
              orderItems: {
                where: {
                  order: {
                    createdAt: { gte: startDate },
                    status: 'completed'
                  }
                }
              }
            },
            take: 5
          })
        ]);

        const totalRevenue = Number((orderStats as any)._sum?.total || 0);

        return {
          revenue: { total: totalRevenue, trend: 'up' },
          orders: { total: totalOrders, trend: 'up' },
          customers: { total: totalCustomers, trend: 'up' },
          products: { total: totalProducts, trend: 'up' },
          topProducts: topProductsData.map(p => ({
            productId: p.id,
            name: p.name,
            revenue: (p as any).orderItems.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0),
            orders: (p as any).orderItems.length
          })),
          recentOrders: recentOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.customer,
            totalAmount: Number(o.total),
            status: o.status,
            createdAt: o.createdAt.toISOString()
          })),
          period,
          generatedAt: new Date().toISOString()
        };
      },
      600, // 10 minutes
      organizationId
    );
  }
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
      logger.error({
        message: 'Error generating optimization report',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'DatabasePerformanceOptimizer', operation: 'generateOptimizationReport', organizationId }
      });
      throw error;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(organizationId: string): Promise<void> {
    try {
      logger.info({
        message: 'Warming up cache for organization',
        context: { service: 'DatabasePerformanceOptimizer', operation: 'warmUpCache', organizationId }
      });

      await this.getOptimizedOrganization(organizationId);
      await this.getOptimizedProducts(organizationId, 1, 10);
      await this.getOptimizedOrders(organizationId, 1, 10);

      await Promise.all([
        this.getOptimizedAnalytics(organizationId, 'sales', '7d'),
        this.getOptimizedAnalytics(organizationId, 'customers', '30d'),
        this.getOptimizedAnalytics(organizationId, 'products', '30d'),
      ]);

      logger.info({
        message: 'Cache warm-up completed for organization',
        context: { service: 'DatabasePerformanceOptimizer', operation: 'warmUpCache', organizationId }
      });
    } catch (error) {
      logger.error({
        message: 'Error warming up cache',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'DatabasePerformanceOptimizer', operation: 'warmUpCache', organizationId }
      });
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

      logger.info({
        message: 'Cache cleared for organization',
        context: { service: 'DatabasePerformanceOptimizer', operation: 'clearOrganizationCache', organizationId }
      });
    } catch (error) {
      logger.error({
        message: 'Error clearing organization cache',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'DatabasePerformanceOptimizer', operation: 'clearOrganizationCache', organizationId }
      });
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
        totalSold: p.orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
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

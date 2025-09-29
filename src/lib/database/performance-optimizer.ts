import { prisma } from '@/lib/prisma';
import { cacheGetWithFallback, cacheSet, cacheKeys } from '@/lib/cache';

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowCount: number;
  cacheHit: boolean;
  timestamp: Date;
}

export interface DatabaseOptimizationReport {
  totalQueries: number;
  slowQueries: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  optimizationSuggestions: string[];
  indexRecommendations: string[];
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  connectionWaitTime: number;
  connectionErrors: number;
}

export class DatabasePerformanceOptimizer {
  private slowQueryThreshold = 1000; // 1 second
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private maxMetricsHistory = 1000;

  /**
   * Optimize database queries with caching and performance monitoring
   */
  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 3600,
    useCache: boolean = true
  ): Promise<T> {
    const startTime = Date.now();

    try {
      let result: T;
      let cacheHit = false;

      if (useCache) {
        result = await cacheGetWithFallback(
          queryKey,
          queryFn,
          ttl
        );
        cacheHit = true;
      } else {
        result = await queryFn();
      }

      const executionTime = Date.now() - startTime;

      // Record performance metrics
      this.recordQueryMetrics({
        query: queryKey,
        executionTime,
        rowCount: Array.isArray(result) ? result.length : 1,
        cacheHit,
        timestamp: new Date(),
      });

      // Alert on slow queries
      if (executionTime > this.slowQueryThreshold) {
        console.warn(`Slow query detected: ${queryKey} took ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.recordQueryMetrics({
        query: queryKey,
        executionTime,
        rowCount: 0,
        cacheHit: false,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Get optimized user data with caching
   */
  async getOptimizedUser(userId: string) {
    const queryKey = cacheKeys.user(userId);
    
    return this.optimizedQuery(
      queryKey,
      () => prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
              subscription: true,
            },
          },
          sessions: {
            where: { expiresAt: { gt: new Date() } },
            select: { id: true, expiresAt: true },
          },
        },
      }),
      1800 // 30 minutes
    );
  }

  /**
   * Get optimized organization data with caching
   */
  async getOptimizedOrganization(organizationId: string) {
    const queryKey = cacheKeys.organization(organizationId);
    
    return this.optimizedQuery(
      queryKey,
      () => prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          subscription: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              lastLoginAt: true,
            },
          },
          settings: true,
        },
      }),
      3600 // 1 hour
    );
  }

  /**
   * Get optimized products with pagination and caching
   */
  async getOptimizedProducts(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      categoryId?: string;
      search?: string;
      status?: string;
    } = {}
  ) {
    const queryKey = `products:${organizationId}:${page}:${limit}:${JSON.stringify(filters)}`;
    
    return this.optimizedQuery(
      queryKey,
      async () => {
        const where: any = {
          organizationId,
          ...(filters.categoryId && { categoryId: filters.categoryId }),
          ...(filters.status && { status: filters.status }),
          ...(filters.search && {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
              { sku: { contains: filters.search, mode: 'insensitive' } },
            ],
          }),
        };

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
              category: {
                select: { id: true, name: true },
              },
              inventory: {
                select: { quantity: true, reserved: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.product.count({ where }),
        ]);

        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      },
      900 // 15 minutes
    );
  }

  /**
   * Get optimized orders with caching
   */
  async getOptimizedOrders(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      customerId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ) {
    const queryKey = `orders:${organizationId}:${page}:${limit}:${JSON.stringify(filters)}`;
    
    return this.optimizedQuery(
      queryKey,
      async () => {
        const where: any = {
          organizationId,
          ...(filters.status && { status: filters.status }),
          ...(filters.customerId && { customerId: filters.customerId }),
          ...(filters.dateFrom || filters.dateTo) && {
            createdAt: {
              ...(filters.dateFrom && { gte: filters.dateFrom }),
              ...(filters.dateTo && { lte: filters.dateTo }),
            },
          },
        };

        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
              customer: {
                select: { id: true, name: true, email: true },
              },
              items: {
                include: {
                  product: {
                    select: { id: true, name: true, sku: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.order.count({ where }),
        ]);

        return {
          orders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      },
      600 // 10 minutes
    );
  }

  /**
   * Get optimized analytics data with caching
   */
  async getOptimizedAnalytics(
    organizationId: string,
    type: string,
    period: string = '30d'
  ) {
    const queryKey = cacheKeys.analytics(organizationId, type, period);
    
    return this.optimizedQuery(
      queryKey,
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
      1800 // 30 minutes
    );
  }

  /**
   * Get database optimization report
   */
  async getOptimizationReport(): Promise<DatabaseOptimizationReport> {
    const totalQueries = this.queryMetrics.length;
    const slowQueries = this.queryMetrics.filter(m => m.executionTime > this.slowQueryThreshold).length;
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
    const averageExecutionTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0;

    const optimizationSuggestions = this.generateOptimizationSuggestions();
    const indexRecommendations = await this.generateIndexRecommendations();

    return {
      totalQueries,
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      optimizationSuggestions,
      indexRecommendations,
    };
  }

  /**
   * Get connection pool metrics
   */
  async getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics> {
    try {
      // Simulate connection pool metrics (in production, these would come from the database driver)
      return {
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        connectionWaitTime: 50,
        connectionErrors: 0,
      };
    } catch (error) {
      console.error('Error getting connection pool metrics:', error);
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        connectionWaitTime: 0,
        connectionErrors: 1,
      };
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(organizationId: string): Promise<void> {
    try {
      console.log(`Warming up cache for organization: ${organizationId}`);

      // Warm up organization data
      await this.getOptimizedOrganization(organizationId);

      // Warm up recent products
      await this.getOptimizedProducts(organizationId, 1, 10);

      // Warm up recent orders
      await this.getOptimizedOrders(organizationId, 1, 10);

      // Warm up analytics data
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
        cacheKeys.organization(organizationId),
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
    
    // Keep only recent metrics to prevent memory leaks
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
    // In production, this would analyze query patterns and suggest indexes
    return [
      'CREATE INDEX IF NOT EXISTS idx_orders_org_status_created ON orders (organization_id, status, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_products_org_category ON products (organization_id, category_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_org_email ON customers (organization_id, email)',
    ];
  }
}

export const databaseOptimizer = new DatabasePerformanceOptimizer();

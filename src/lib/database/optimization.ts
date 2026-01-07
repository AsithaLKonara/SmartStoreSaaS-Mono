import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

export interface QueryMetrics {
  query: string;
  executionTime: number;
  timestamp: Date;
  parameters?: any[];
}

class DatabaseOptimizer {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second

  // Optimize product queries
  async getProductsOptimized(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const startTime = Date.now();
    
    try {
      const { page = 1, limit = 10, search, categoryId, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Execute optimized query with select only needed fields
      const [products, total] = await Promise.all([
        // Use select to only fetch needed fields
        global.prisma.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            sku: true,
            price: true,
            cost: true,
            stock: true,
            isActive: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
            // Only include category name if needed
            ...(categoryId && {
              category: {
                select: {
                  name: true,
                },
              },
            }),
          },
          orderBy,
          skip,
          take: limit,
        }),
        // Count query for pagination
        global.prisma.product.count({ where }),
      ]);

      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT products with filters`, executionTime, { where, orderBy, skip, limit });

      return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT products ERROR`, executionTime, { error: error.message });
      throw error;
    }
  }

  // Optimize order queries
  async getOrdersOptimized(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const startTime = Date.now();
    
    try {
      const { page = 1, limit = 10, status, customerId, dateFrom, dateTo } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (customerId) {
        where.customerId = customerId;
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      // Execute optimized query
      const [orders, total] = await Promise.all([
        global.prisma.order.findMany({
          where,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            orderItems: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        global.prisma.order.count({ where }),
      ]);

      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT orders with filters`, executionTime, { where, skip, limit });

      return {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT orders ERROR`, executionTime, { error: error.message });
      throw error;
    }
  }

  // Optimize customer queries
  async getCustomersOptimized(params: {
    page?: number;
    limit?: number;
    search?: string;
    segment?: string;
  }) {
    const startTime = Date.now();
    
    try {
      const { page = 1, limit = 10, search, segment } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (segment) {
        where.customer_segments = {
          some: {
            segment: segment,
          },
        };
      }

      // Execute optimized query
      const [customers, total] = await Promise.all([
        global.prisma.customer.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            createdAt: true,
            updatedAt: true,
            // Include order count for dashboard
            _count: {
              select: {
                orders: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        global.prisma.customer.count({ where }),
      ]);

      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT customers with filters`, executionTime, { where, skip, limit });

      return {
        customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT customers ERROR`, executionTime, { error: error.message });
      throw error;
    }
  }

  // Get dashboard statistics efficiently
  async getDashboardStats() {
    const startTime = Date.now();
    
    try {
      // Use Promise.all for parallel execution
      const [productCount, orderCount, customerCount, revenueData] = await Promise.all([
        global.prisma.product.count({
          where: { isActive: true },
        }),
        global.prisma.order.count({
          where: {
            status: { in: ['completed', 'processing', 'shipped'] },
          },
        }),
        global.prisma.customer.count(),
        global.prisma.order.aggregate({
          where: {
            status: 'completed',
          },
          _sum: {
            total: true,
          },
        }),
      ]);

      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT dashboard stats`, executionTime);

      return {
        products: productCount,
        orders: orderCount,
        customers: customerCount,
        revenue: revenueData._sum.total || 0,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackQuery(`SELECT dashboard stats ERROR`, executionTime, { error: error.message });
      throw error;
    }
  }

  // Track query performance
  private trackQuery(query: string, executionTime: number, parameters?: any) {
    const metric: QueryMetrics = {
      query,
      executionTime,
      timestamp: new Date(),
      parameters,
    };

    this.metrics.push(metric);

    // Log slow queries
    if (executionTime > this.slowQueryThreshold) {
      logger.warn({
        message: 'Slow query detected',
        context: { service: 'DatabaseOptimizer', operation: 'logQuery', query, executionTime, parameters }
      });
    }

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get query performance metrics
  getQueryMetrics(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: QueryMetrics[];
    queriesByType: Record<string, number>;
  } {
    const totalQueries = this.metrics.length;
    const averageExecutionTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries || 0;
    const slowQueries = this.metrics.filter(m => m.executionTime > this.slowQueryThreshold);
    
    const queriesByType = this.metrics.reduce((acc, metric) => {
      const type = metric.query.split(' ')[0]; // Get first word (SELECT, INSERT, etc.)
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowQueries,
      queriesByType,
    };
  }

  // Clear old metrics
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    this.metrics = this.metrics.filter(metric => 
      metric.timestamp > cutoffTime
    );
  }
}

// Singleton instance
export const databaseOptimizer = new DatabaseOptimizer();

// Database indexing recommendations
export const INDEXING_RECOMMENDATIONS = {
  products: [
    'CREATE INDEX idx_products_name ON products(name);',
    'CREATE INDEX idx_products_sku ON products(sku);',
    'CREATE INDEX idx_products_category ON products(categoryId);',
    'CREATE INDEX idx_products_active ON products(isActive);',
    'CREATE INDEX idx_products_created_at ON products(createdAt);',
  ],
  orders: [
    'CREATE INDEX idx_orders_status ON orders(status);',
    'CREATE INDEX idx_orders_customer ON orders(customerId);',
    'CREATE INDEX idx_orders_created_at ON orders(createdAt);',
    'CREATE INDEX idx_orders_status_created ON orders(status, createdAt);',
  ],
  customers: [
    'CREATE INDEX idx_customers_email ON customers(email);',
    'CREATE INDEX idx_customers_name ON customers(name);',
    'CREATE INDEX idx_customers_phone ON customers(phone);',
    'CREATE INDEX idx_customers_created_at ON customers(createdAt);',
  ],
  order_items: [
    'CREATE INDEX idx_order_items_order ON order_items(orderId);',
    'CREATE INDEX idx_order_items_product ON order_items(productId);',
  ],
};

// Query optimization tips
export const QUERY_OPTIMIZATION_TIPS = [
  'Use SELECT with specific fields instead of SELECT *',
  'Add appropriate indexes for frequently queried columns',
  'Use LIMIT for pagination to avoid loading large datasets',
  'Use WHERE clauses to filter data at the database level',
  'Avoid N+1 queries by using include/select properly',
  'Use database-level aggregations instead of application-level calculations',
  'Consider using database views for complex queries',
  'Monitor and analyze slow query logs regularly',
  'Use connection pooling for better performance',
  'Consider read replicas for read-heavy workloads',
];
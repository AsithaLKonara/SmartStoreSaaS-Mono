import { prisma } from '@/lib/prisma';

/**
 * Database optimization utilities for production performance
 */

// Database indices for common queries
export const DATABASE_INDICES = [
  // Products: search & sorting
  `CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products (organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_sku_org ON products (sku, organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_slug_org ON products (slug, organization_id)`,
  
  // Orders: common filters
  `CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders (customer_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_organization_id ON orders (organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status)`,
  
  // Customers
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_org ON customers (email, organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers (organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC)`,
  
  // Line items
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id)`,
  
  // Sessions/JWTs
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_exp ON sessions (user_id, expires_at)`,
  
  // Activities
  `CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities (organization_id)`,
  
  // Chat conversations
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_org_status ON chat_conversations (organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_customer_id ON chat_conversations (customer_id)`,
  
  // Chat messages
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages (conversation_id, created_at DESC)`,
];

// Full-text search indices (if using PostgreSQL with pg_trgm)
export const FULLTEXT_INDICES = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING GIN (description gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers USING GIN (email gin_trgm_ops)`,
];

/**
 * Create database indices for performance optimization
 */
export async function createDatabaseIndices(): Promise<void> {
  try {
    console.log('Creating database indices...');
    
    for (const indexQuery of DATABASE_INDICES) {
      try {
        await prisma.$executeRawUnsafe(indexQuery);
        console.log(`✓ Created index: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`✓ Index already exists: ${indexQuery.split(' ')[5]}`);
        } else {
          console.warn(`⚠ Failed to create index: ${indexQuery.split(' ')[5]}`, error);
        }
      }
    }
    
    console.log('Database indices creation completed');
  } catch (error) {
    console.error('Error creating database indices:', error);
    throw error;
  }
}

/**
 * Create full-text search indices (PostgreSQL specific)
 */
export async function createFulltextIndices(): Promise<void> {
  try {
    console.log('Creating full-text search indices...');
    
    for (const indexQuery of FULLTEXT_INDICES) {
      try {
        await prisma.$executeRawUnsafe(indexQuery);
        console.log(`✓ Created full-text index: ${indexQuery.split(' ')[5] || 'extension'}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`✓ Full-text index already exists: ${indexQuery.split(' ')[5] || 'extension'}`);
        } else {
          console.warn(`⚠ Failed to create full-text index: ${indexQuery.split(' ')[5] || 'extension'}`, error);
        }
      }
    }
    
    console.log('Full-text search indices creation completed');
  } catch (error) {
    console.error('Error creating full-text search indices:', error);
    throw error;
  }
}

/**
 * Database performance monitoring queries
 */
export const PERFORMANCE_QUERIES = {
  // Check for slow queries
  slowQueries: `
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      rows
    FROM pg_stat_statements 
    ORDER BY mean_time DESC 
    LIMIT 10
  `,
  
  // Check table sizes
  tableSizes: `
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `,
  
  // Check index usage
  indexUsage: `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes 
    ORDER BY idx_scan DESC
  `,
  
  // Check connection count
  connectionCount: `
    SELECT 
      count(*) as active_connections
    FROM pg_stat_activity 
    WHERE state = 'active'
  `,
};

/**
 * Get database performance metrics
 */
export async function getDatabaseMetrics() {
  try {
    const metrics: Record<string, any> = {};
    
    // Get connection count
    try {
      const connectionResult = await prisma.$queryRawUnsafe(PERFORMANCE_QUERIES.connectionCount);
      metrics.connections = connectionResult;
    } catch (error) {
      metrics.connections = { error: 'Failed to get connection count' };
    }
    
    // Get table sizes
    try {
      const tableSizesResult = await prisma.$queryRawUnsafe(PERFORMANCE_QUERIES.tableSizes);
      metrics.tableSizes = tableSizesResult;
    } catch (error) {
      metrics.tableSizes = { error: 'Failed to get table sizes' };
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting database metrics:', error);
    return { error: 'Failed to get database metrics' };
  }
}

/**
 * Database connection string optimization for PgBouncer
 */
export function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // Add PgBouncer and connection optimization parameters
  const optimizedUrl = new URL(baseUrl);
  optimizedUrl.searchParams.set('pgbouncer', 'true');
  optimizedUrl.searchParams.set('connection_limit', '1');
  optimizedUrl.searchParams.set('pool_timeout', '30');
  optimizedUrl.searchParams.set('statement_timeout', '5000'); // 5 seconds
  
  return optimizedUrl.toString();
}

/**
 * Initialize database optimization
 */
export async function initializeDatabaseOptimization(): Promise<void> {
  try {
    console.log('Initializing database optimization...');
    
    // Create performance indices
    await createDatabaseIndices();
    
    // Create full-text search indices (PostgreSQL only)
    try {
      await createFulltextIndices();
    } catch (error) {
      console.warn('Full-text search indices not supported or failed:', error);
    }
    
    console.log('Database optimization completed successfully');
  } catch (error) {
    console.error('Database optimization failed:', error);
    throw error;
  }
}

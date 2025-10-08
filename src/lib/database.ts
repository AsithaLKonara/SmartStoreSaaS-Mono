import { PrismaClient } from '@prisma/client';
import { dbLogger } from '@/lib/utils/logger';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client
export const db = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

// Database Manager Class
class DatabaseManager {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  // Health check method
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await this.client.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      dbLogger.debug('Database health check successful', { responseTime });
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      dbLogger.error('Database health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Execute with retry logic
  async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation(this.client);
        const duration = Date.now() - startTime;
        
        dbLogger.debug(`Database operation successful: ${operationName}`, { 
          attempt, 
          duration 
        });
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        dbLogger.warn(`Database operation failed: ${operationName}`, { 
          attempt, 
          maxRetries, 
          error: lastError.message 
        });
        
        if (attempt === maxRetries) {
          dbLogger.error(`Database operation failed after ${maxRetries} attempts: ${operationName}`, { 
            error: lastError.message 
          });
          throw lastError;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError || new Error('Operation failed');
  }

  // Get the Prisma client
  getClient(): PrismaClient {
    return this.client;
  }

  // Close connection
  async disconnect() {
    await this.client.$disconnect();
  }
}

// Create and export the database manager instance
const dbManager = new DatabaseManager();
export { dbManager };
export default dbManager;

// Export a function to get a fresh connection when needed
export const getFreshConnection = () => {
  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Export a function to close connections
export const closeConnection = async (client?: PrismaClient) => {
  if (client) {
    await client.$disconnect();
  }
};

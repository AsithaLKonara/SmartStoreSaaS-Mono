import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation(this.prisma);
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName} attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async healthCheck(): Promise<{ status: string; details?: string; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        details: 'Database connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: 'Database connection failed'
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

const dbManager = new DatabaseManager();
export default dbManager;



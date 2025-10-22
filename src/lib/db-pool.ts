import { PrismaClient } from '@prisma/client';

// Global Prisma client instance with connection pooling
declare global {
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: 'file:./dev.db',
      },
    },
  });
};

// Use global instance in development to prevent multiple connections
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, error: null };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  await prisma.$disconnect();
}

export default prisma;

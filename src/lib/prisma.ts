import { PrismaClient } from '@prisma/client';
import { tenantExtension } from './prisma-extension';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export const prisma = basePrisma.$extends(tenantExtension);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 
import { prisma as prismaInstance } from './prisma';

export const prisma = prismaInstance;

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

export async function closeDatabaseConnection() {
  await prisma.$disconnect();
}

export default prisma;

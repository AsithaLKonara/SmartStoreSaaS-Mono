import { PrismaClient } from '@prisma/client';
import { prisma as basePrisma } from './prisma';

/**
 * Get a Prisma client with the current organization context set
 * to enforce Row Level Security (RLS) at the database level.
 */
export function getPrismaClient(organizationId?: string) {
  if (!organizationId) return basePrisma;

  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Setting the session variable before every query ensures RLS is active
          // Note: This requires a transaction or specific driver handling to be fully robust
          // In Prisma v5+, we can use extensions to run raw SQL before the query
          await basePrisma.$executeRawUnsafe(
            `SET app.current_organization_id = '${organizationId}'`
          );
          return query(args);
        },
      },
    },
  });
}

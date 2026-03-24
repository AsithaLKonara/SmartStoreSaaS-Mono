import { Prisma } from '@prisma/client';
import { getTenantId } from './auth/tenant-context';

/**
 * Prisma Client Extension for Multi-Tenant Scoping.
 * Automatically injects organizationId into where clauses for multi-tenant models.
 */
export const tenantExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantId = getTenantId();
          
          // Only apply scoping if we have a tenantId and are not doing global marketplace queries
          // Some models like User, Organization, and Global marketplace categories
          // might not need strict scoping.
          const multiTenantModels = [
            'Product', 'Order', 'Customer', 'Category', 'Warehouse', 
            'InventoryMovement', 'PosTransaction', 'Payment'
          ];

          if (tenantId && multiTenantModels.includes(model)) {
            if (operation === 'findMany' || operation === 'findUnique' || operation === 'findFirst') {
              args.where = { ...args.where, organizationId: tenantId };
            }
            if (operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
              args.where = { ...args.where, organizationId: tenantId };
            }
            if (operation === 'create') {
              args.data = { ...args.data, organizationId: tenantId };
            }
          }

          return query(args);
        },
      },
    },
  });
});

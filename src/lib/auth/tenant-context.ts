import { AsyncLocalStorage } from 'async_hooks';

/**
 * Global context to store the current tenant ID during a request.
 * Allows deep-scoping of database queries without manually passing orgId.
 */
export const tenantContext = new AsyncLocalStorage<{ organizationId: string }>();

export function getTenantId(): string | undefined {
  return tenantContext.getStore()?.organizationId;
}

export function runInTenantContext<T>(organizationId: string, fn: () => T): T {
  return tenantContext.run({ organizationId }, fn);
}

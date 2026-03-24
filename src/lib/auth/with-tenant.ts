import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { runInTenantContext } from './tenant-context';
import { NextResponse } from 'next/server';

/**
 * Higher-Order Function for Route Handlers to inject Tenant Context.
 * Ensures the Prisma Tenant Extension picks up the correct organizationId.
 */
export function withTenant(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.organizationId;

    if (!orgId) {
      // For Marketplace (public) routes, we might not have an orgId.
      // We allow the handler to run without a tenantId context,
      // which the Prisma extension will skip (permitting global queries).
      return handler(req, ...args);
    }

    // Run the handler inside the AsyncLocalStorage context
    return runInTenantContext(orgId, () => handler(req, ...args));
  };
}

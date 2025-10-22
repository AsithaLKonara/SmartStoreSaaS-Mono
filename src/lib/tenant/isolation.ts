/**
 * Multi-Tenant Data Isolation
 * Ensures all database queries are scoped to the user's organization
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@/lib/rbac/roles';
import { logger } from '@/lib/logger';

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

/**
 * Get tenant context from request
 */
export async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return null;
    }
    
    const role = (token.role as UserRole) || UserRole.TENANT_ADMIN;
    const isSuperAdmin = role === UserRole.SUPER_ADMIN;
    
    return {
      organizationId: token.organizationId as string,
      userId: token.sub as string,
      role,
      isSuperAdmin
    };
  } catch (error) {
    logger.error({
      message: 'Error getting tenant context',
      error: error,
      context: { url: request.url }
    });
    return null;
  }
}

/**
 * Add tenant filter to Prisma where clause
 * Super Admin can access all organizations
 */
export function addTenantFilter<T extends Record<string, any>>(
  where: T,
  organizationId: string | null,
  isSuperAdmin: boolean = false
): T {
  // Super Admin can see all data (no filter)
  if (isSuperAdmin) {
    return where;
  }
  
  // Regular users can only see their organization's data
  if (organizationId) {
    return {
      ...where,
      organizationId
    };
  }
  
  return where;
}

/**
 * Ensure user owns/has access to a resource
 */
export async function ensureTenantOwnership(
  request: NextRequest,
  resourceOrganizationId: string
): Promise<boolean> {
  const context = await getTenantContext(request);
  
  if (!context) {
    return false;
  }
  
  // Super Admin can access all resources
  if (context.isSuperAdmin) {
    return true;
  }
  
  // Regular users can only access their own organization's resources
  return context.organizationId === resourceOrganizationId;
}

/**
 * Get organization ID for creating new resources
 */
export async function getOrganizationIdForCreate(request: NextRequest): Promise<string | null> {
  const context = await getTenantContext(request);
  return context?.organizationId || null;
}

/**
 * Middleware wrapper for tenant-isolated API routes
 */
export function withTenantIsolation(handler: Function) {
  return async function (request: NextRequest, ...args: any[]) {
    const context = await getTenantContext(request);
    
    if (!context) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Add context to request for use in handler
    (request as any).tenantContext = context;
    
    return handler(request, ...args);
  };
}

/**
 * Filter query results to only include user's organization
 */
export function filterByOrganization<T extends { organizationId: string }>(
  items: T[],
  organizationId: string | null,
  isSuperAdmin: boolean = false
): T[] {
  if (isSuperAdmin) {
    return items;
  }
  
  if (!organizationId) {
    return [];
  }
  
  return items.filter(item => item.organizationId === organizationId);
}

/**
 * Validate that organization ID matches user's organization
 */
export function validateOrganizationAccess(
  userOrganizationId: string,
  resourceOrganizationId: string,
  isSuperAdmin: boolean = false
): boolean {
  if (isSuperAdmin) {
    return true;
  }
  
  return userOrganizationId === resourceOrganizationId;
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, Permission, hasPermission, canAccessRoute } from './roles';
import { logger } from '@/lib/logger';

export async function checkPermission(
  request: NextRequest,
  requiredPermission: Permission
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return { authorized: false, error: 'Not authenticated' };
    }
    
    const userRole = token.role as UserRole || UserRole.TENANT_ADMIN;
    const roleTag = token.roleTag as string | undefined;
    
    if (!hasPermission(userRole, requiredPermission, roleTag)) {
      return { authorized: false, error: 'Insufficient permissions' };
    }
    
    return { authorized: true, user: token };
  } catch (error) {
    logger.error({
      message: 'Permission check error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'RBAC', operation: 'checkPermission', requiredPermission }
    });
    return { authorized: false, error: 'Permission check failed' };
  }
}

export async function checkRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return { authorized: false, error: 'Not authenticated' };
    }
    
    const userRole = token.role as UserRole || UserRole.TENANT_ADMIN;
    
    if (!allowedRoles.includes(userRole)) {
      return { authorized: false, error: 'Insufficient role' };
    }
    
    return { authorized: true, user: token };
  } catch (error) {
    logger.error({
      message: 'Role check error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'RBAC', operation: 'checkRole', allowedRoles }
    });
    return { authorized: false, error: 'Role check failed' };
  }
}

export async function requireSuperAdmin(request: NextRequest) {
  return checkRole(request, [UserRole.SUPER_ADMIN]);
}

export async function requireTenantAdmin(request: NextRequest) {
  return checkRole(request, [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]);
}

export async function requireStaff(request: NextRequest) {
  return checkRole(request, [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]);
}

// Get user's organization ID for tenant isolation
export async function getUserOrganizationId(request: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    return token?.organizationId as string || null;
  } catch (error) {
    return null;
  }
}

// Middleware wrapper for API routes
export function withRBAC(allowedRoles: UserRole[]) {
  return async function (request: NextRequest, handler: Function) {
    const check = await checkRole(request, allowedRoles);
    
    if (!check.authorized) {
      return NextResponse.json(
        { success: false, error: check.error },
        { status: 403 }
      );
    }
    
    return handler(request, check.user);
  };
}

// Middleware wrapper with permission check
export function withPermission(requiredPermission: Permission) {
  return async function (request: NextRequest, handler: Function) {
    const check = await checkPermission(request, requiredPermission);
    
    if (!check.authorized) {
      return NextResponse.json(
        { success: false, error: check.error },
        { status: 403 }
      );
    }
    
    return handler(request, check.user);
  };
}


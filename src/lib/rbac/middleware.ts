import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, Permission, hasPermission, canAccessRoute } from './roles';
export { UserRole, Permission };
import { logger } from '@/lib/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  roleTag?: string;
  organizationId?: string;
  activeOrganizationId?: string | null;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
  correlationId: string;
}

export async function checkPermission(
  request: NextRequest,
  requiredPermission: Permission | string
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

// POS specific checks
export async function requirePosTerminal(request: NextRequest) {
  return checkPermission(request, 'pos.use_terminal');
}

export async function requirePosPayment(request: NextRequest) {
  return checkPermission(request, 'pos.process_payment');
}

export async function requirePosRefund(request: NextRequest) {
  return checkPermission(request, 'pos.refund');
}

export async function requirePosManageShift(request: NextRequest) {
  return checkPermission(request, 'pos.manage_shift');
}

/**
 * Legacy Support Functions
 */

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) return null;

    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      role: (token.role as UserRole) || UserRole.CUSTOMER,
      roleTag: token.roleTag as string,
      organizationId: token.organizationId as string,
      activeOrganizationId: request.headers.get('x-tenant-id') || (token.activeOrganizationId as string) || null
    };
  } catch (error) {
    return null;
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest, user: AuthenticatedUser, params?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ success: false, code: 'ERR_AUTH', message: 'Authentication required' }, { status: 401 });
    }

    (request as unknown as AuthenticatedRequest).user = user;
    (request as unknown as AuthenticatedRequest).correlationId = request.headers.get('x-correlation-id') || uuidv4();

    try {
      return await handler(request as unknown as AuthenticatedRequest, user, params);
    } catch (error: any) {
      logger.error({
        message: 'API handler error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { path: request.nextUrl.pathname, userId: user.id }
      });

      if (error.statusCode) {
        return NextResponse.json({
          success: false,
          code: error.code || 'ERR_INTERNAL',
          message: error.message,
          correlation: (request as any).correlationId
        }, { status: error.statusCode });
      }

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Internal server error',
        correlation: (request as any).correlationId
      }, { status: 500 });
    }
  };
}

export function requireRole(allowedRoles: UserRole | UserRole[] | string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles as string[] : [allowedRoles as string];

  return (handler: (req: AuthenticatedRequest, user: AuthenticatedUser, params?: any) => Promise<NextResponse>) => {
    return requireAuth(async (request, user, params) => {
      if (!roles.includes(user.role as string)) {
        return NextResponse.json({ success: false, code: 'ERR_FORBIDDEN', message: 'Insufficient permissions' }, { status: 403 });
      }
      return handler(request, user, params);
    });
  };
}

export function requirePermission(permission: string | Permission) {
  return (handler: (req: AuthenticatedRequest, user: AuthenticatedUser, params?: any) => Promise<NextResponse>) => {
    return requireAuth(async (request, user, params) => {
      if (!hasPermission(user.role, permission, user.roleTag)) {
        return NextResponse.json({ success: false, code: 'ERR_FORBIDDEN', message: `Permission required: ${permission}` }, { status: 403 });
      }
      return handler(request, user, params);
    });
  };
}

export function getOrganizationScope(user: AuthenticatedUser, requestOrgId?: string): string {
  if (user.role === UserRole.SUPER_ADMIN) {
    const activeOrg = requestOrgId || user.activeOrganizationId || user.organizationId;
    // For SUPER_ADMIN, we return the active org or their own org if set
    return activeOrg || '';
  }

  if (!user.organizationId) {
    throw new Error('User does not belong to an organization');
  }
  return user.organizationId;
}

export function validateOrganizationAccess(user: AuthenticatedUser, resourceOrganizationId: string): boolean {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  return user.organizationId === resourceOrganizationId;
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


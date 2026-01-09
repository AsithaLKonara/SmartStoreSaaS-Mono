/**
 * Centralized Authentication & Authorization Middleware
 * 
 * Provides reusable middleware for:
 * - Authentication checks
 * - Role-based authorization
 * - Permission-based authorization
 * - Organization scoping
 * 
 * Usage:
 *   export const GET = requireAuth(
 *     requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(handler)
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { AuthenticationError, AuthorizationError } from './withErrorHandler';

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'STAFF' | 'CUSTOMER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  roleTag?: string;
  organizationId?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
  correlationId: string;
}

/**
 * Permission definitions based on role
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'VIEW_ALL_ORGANIZATIONS',
    'MANAGE_ORGANIZATIONS',
    'VIEW_SYSTEM_LOGS',
    'MANAGE_SYSTEM_SETTINGS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_PACKAGES',
    'VIEW_USERS',
    'MANAGE_USERS',
    'VIEW_PRODUCTS',
    'MANAGE_PRODUCTS',
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'VIEW_CUSTOMERS',
    'MANAGE_CUSTOMERS',
    'VIEW_INVENTORY',
    'MANAGE_INVENTORY',
    'VIEW_ANALYTICS',
    'VIEW_REPORTS',
    'VIEW_AI_INSIGHTS',
    'VIEW_SETTINGS',
    'MANAGE_SETTINGS',
    'VIEW_BILLING',
    'MANAGE_BILLING',
    'VIEW_MONITORING',
    'MANAGE_MONITORING',
    'VIEW_SUPPORT',
    'MANAGE_SUPPORT',
    'CREATE_SUPPORT_TICKET',
    'VIEW_WEBHOOKS',
    'MANAGE_WEBHOOKS',
    'VIEW_MARKETING',
    'MANAGE_MARKETING',
    'VIEW_CAMPAIGNS',
    'MANAGE_CAMPAIGNS'
  ],
  TENANT_ADMIN: [
    'VIEW_USERS',
    'MANAGE_USERS',
    'VIEW_PRODUCTS',
    'MANAGE_PRODUCTS',
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'VIEW_CUSTOMERS',
    'MANAGE_CUSTOMERS',
    'VIEW_INVENTORY',
    'MANAGE_INVENTORY',
    'VIEW_ANALYTICS',
    'VIEW_REPORTS',
    'VIEW_AI_INSIGHTS',
    'VIEW_SETTINGS',
    'MANAGE_SETTINGS',
    'VIEW_BILLING',
    'MANAGE_BILLING',
    'VIEW_ORGANIZATION',
    'MANAGE_ORGANIZATION_SETTINGS',
    'VIEW_SUPPORT',
    'MANAGE_SUPPORT',
    'CREATE_SUPPORT_TICKET',
    'VIEW_WEBHOOKS',
    'MANAGE_WEBHOOKS',
    'VIEW_MARKETING',
    'MANAGE_MARKETING',
    'VIEW_CAMPAIGNS',
    'MANAGE_CAMPAIGNS'
  ],
  STAFF: [
    'VIEW_ASSIGNED_PRODUCTS',
    'VIEW_ASSIGNED_CUSTOMERS',
    'VIEW_ASSIGNED_INVENTORY',
    'VIEW_ORDERS',
    'CREATE_ORDERS',
    'VIEW_SUPPORT',
    'CREATE_SUPPORT_TICKET'
  ],
  CUSTOMER: [
    'VIEW_OWN_ORDERS',
    'VIEW_BILLING_INFO',
    'CREATE_SUPPORT_TICKET',
    'VIEW_OWN_SUPPORT_TICKETS'
  ]
};

/**
 * Check if user has specific permission
 */
export function hasPermission(role: UserRole, permission: string, roleTag?: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  // Super admin has all permissions
  if (role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Staff permissions depend on roleTag
  if (role === 'STAFF' && roleTag) {
    const staffPermissions: Record<string, string[]> = {
      sales_staff: ['VIEW_PRODUCTS', 'VIEW_ORDERS', 'CREATE_ORDERS', 'VIEW_CUSTOMERS'],
      inventory_manager: ['VIEW_PRODUCTS', 'MANAGE_PRODUCTS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY'],
      customer_service: ['VIEW_CUSTOMERS', 'VIEW_ORDERS', 'UPDATE_ORDERS', 'MANAGE_CUSTOMERS'],
      accountant: ['VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_BILLING']
    };
    
    const tagPermissions = staffPermissions[roleTag] || [];
    return tagPermissions.includes(permission);
  }
  
  return permissions.includes(permission);
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      return null;
    }
    
    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      role: (token.role as UserRole) || 'CUSTOMER',
      roleTag: token.roleTag as string,
      organizationId: token.organizationId as string
    };
  } catch (error) {
    logger.error({
      message: 'Failed to get authenticated user',
      error: error,
      context: { url: request.url }
    });
    return null;
  }
}

/**
 * Require authentication middleware
 */
export function requireAuth(handler: (req: AuthenticatedRequest, user: AuthenticatedUser, params?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      logger.warn({
        message: 'Unauthenticated access attempt',
        context: {
          url: request.url,
          method: request.method,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });
      
      return NextResponse.json(
        {
          success: false,
          code: 'ERR_AUTH',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }
    
    // Attach user to request
    (request as AuthenticatedRequest).user = user;

    return handler(request as AuthenticatedRequest, user, params);
  };
}

/**
 * Require specific role(s) middleware
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (handler: (req: AuthenticatedRequest, user: AuthenticatedUser, params?: any) => Promise<NextResponse>) => {
    return requireAuth(async (request, user, params) => {
      if (!roles.includes(user.role)) {
        logger.warn({
          message: 'Unauthorized role access attempt',
          context: {
            url: request.url,
            method: request.method,
            userId: user.id,
            userRole: user.role,
            requiredRoles: roles
          }
        });

        return NextResponse.json(
          {
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Insufficient permissions'
          },
          { status: 403 }
        );
      }

      return handler(request, user, params);
    });
  };
}

/**
 * Require specific permission middleware
 */
export function requirePermission(permission: string) {
  return (handler: (req: AuthenticatedRequest, user: AuthenticatedUser) => Promise<NextResponse>) => {
    return requireAuth(async (request, user) => {
      if (!hasPermission(user.role, permission, user.roleTag)) {
        logger.warn({
          message: 'Unauthorized permission access attempt',
          context: {
            url: request.url,
            method: request.method,
            userId: user.id,
            userRole: user.role,
            requiredPermission: permission
          }
        });
        
        return NextResponse.json(
          {
            success: false,
            code: 'ERR_FORBIDDEN',
            message: `Permission required: ${permission}`
          },
          { status: 403 }
        );
      }
      
      return handler(request, user);
    });
  };
}

/**
 * Get organization ID for scoping queries
 * SUPER_ADMIN can optionally bypass scoping
 */
export function getOrganizationScope(user: AuthenticatedUser, requestOrgId?: string): string | null {
  // SUPER_ADMIN can query across organizations if orgId provided
  if (user.role === 'SUPER_ADMIN') {
    return requestOrgId || null;
  }
  
  // All other roles must use their organization
  return user.organizationId || null;
}

/**
 * Validate organization access
 * Ensures user can only access data from their organization
 */
export function validateOrganizationAccess(
  user: AuthenticatedUser,
  resourceOrganizationId: string
): boolean {
  // SUPER_ADMIN can access all organizations
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Others can only access their own organization
  return user.organizationId === resourceOrganizationId;
}

/**
 * Example usage:
 * 
 * // Require authentication only
 * export const GET = requireAuth(async (req, user) => {
 *   // user is guaranteed to exist
 * });
 * 
 * // Require specific role
 * export const GET = requireRole('SUPER_ADMIN')(async (req, user) => {
 *   // Only SUPER_ADMIN can access
 * });
 * 
 * // Require multiple roles
 * export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(async (req, user) => {
 *   // SUPER_ADMIN or TENANT_ADMIN can access
 * });
 * 
 * // Require specific permission
 * export const GET = requirePermission('VIEW_USERS')(async (req, user) => {
 *   // Anyone with VIEW_USERS permission can access
 * });
 * 
 * // With organization scoping
 * export const GET = requirePermission('VIEW_PRODUCTS')(async (req, user) => {
 *   const orgId = getOrganizationScope(user);
 *   const products = await prisma.product.findMany({
 *     where: { organizationId: orgId }
 *   });
 * });
 */

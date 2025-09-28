import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser;
}

// Role definitions
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.USER]: 1,
};

// Permission definitions
export const PERMISSIONS = {
  // User Management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Organization Management
  ORG_READ: 'org:read',
  ORG_WRITE: 'org:write',
  ORG_DELETE: 'org:delete',
  
  // Product Management
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',
  
  // Order Management
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDERS_DELETE: 'orders:delete',
  
  // Customer Management
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_DELETE: 'customers:delete',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_WRITE: 'analytics:write',
  
  // Billing
  BILLING_READ: 'billing:read',
  BILLING_WRITE: 'billing:write',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_WRITE,
    PERMISSIONS.ORG_DELETE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.ORDERS_DELETE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_WRITE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_WRITE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_WRITE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_WRITE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_WRITE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
  [ROLES.USER]: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
};

// Utility functions
export function hasRole(userRole: string, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole as Role] >= ROLE_HIERARCHY[requiredRole];
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole as Role] || [];
  return userPermissions.includes(permission);
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Middleware functions
export async function withAuth(
  request: NextRequest,
  options: {
    requiredRole?: Role;
    requiredPermissions?: Permission[];
    requireAuth?: boolean;
  } = {}
) {
  const { requiredRole, requiredPermissions = [], requireAuth = true } = options;

  try {
    // Try NextAuth token first
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    let user: AuthUser | null = null;

    if (token) {
      // NextAuth token
      user = {
        id: token.sub!,
        email: token.email!,
        name: token.name || '',
        role: token.role as string,
        organizationId: token.organizationId as string,
      };
    } else {
      // Try custom JWT token
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const customToken = authHeader.substring(7);
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(customToken, process.env.JWT_SECRET || 'fallback-secret') as any;
          user = {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name || '',
            role: decoded.role,
            organizationId: decoded.organizationId,
          };
        } catch (jwtError) {
          // Invalid JWT token, continue with null user
        }
      }
    }

    if (!user && requireAuth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.next();
    }

    // Check role requirement
    if (requiredRole && !hasRole(user.role, requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && !hasAllPermissions(user.role, requiredPermissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add user to request
    (request as AuthRequest).user = user;

    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

export function createAuthHandler(
  handler: (request: AuthRequest) => Promise<NextResponse>,
  options?: {
    requiredRole?: Role;
    requiredPermissions?: Permission[];
    requireAuth?: boolean;
  }
) {
  return async (request: NextRequest) => {
    const authResponse = await withAuth(request, options);
    
    if (authResponse.status !== 200) {
      return authResponse;
    }

    return handler(request as AuthRequest);
  };
}

// Route protection helpers
export const authConfig = {
  // Admin routes
  admin: {
    requiredRole: ROLES.ADMIN,
    requiredPermissions: [PERMISSIONS.ORG_READ],
  },
  
  // Manager routes
  manager: {
    requiredRole: ROLES.MANAGER,
    requiredPermissions: [PERMISSIONS.USERS_READ],
  },
  
  // User routes
  user: {
    requiredRole: ROLES.USER,
    requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
  },
  
  // API routes
  api: {
    requireAuth: true,
  },
};

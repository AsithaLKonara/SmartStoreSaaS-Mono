// Roles definition
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    TENANT_ADMIN: 'TENANT_ADMIN',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
    CUSTOMER: 'CUSTOMER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permissions definition
export const PERMISSIONS = {
    // User Management
    MANAGE_USERS: 'manage_users',
    VIEW_USERS: 'view_users',

    // Inventory
    MANAGE_INVENTORY: 'manage_inventory',
    VIEW_INVENTORY: 'view_inventory',

    // Orders
    MANAGE_ORDERS: 'manage_orders',
    VIEW_ORDERS: 'view_orders',

    // Settings
    MANAGE_SETTINGS: 'manage_settings',

    // Analytics
    VIEW_ANALYTICS: 'view_analytics',

    // Finance
    MANAGE_FINANCE: 'manage_finance',
    VIEW_FINANCE: 'view_finance',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role to Permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.TENANT_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.MANAGE_INVENTORY,
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.MANAGE_ORDERS,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.VIEW_USERS,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.VIEW_ORDERS,
    ],
    [ROLES.CUSTOMER]: [],
};

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
    if (userRole === ROLES.SUPER_ADMIN) return true;

    // Hierarchy check could be added here
    if (userRole === ROLES.TENANT_ADMIN && requiredRole !== ROLES.SUPER_ADMIN) return true;

    return userRole === requiredRole;
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userRole: string, requiredPermissions: string[]): boolean {
    if (userRole === ROLES.SUPER_ADMIN) return true;
    if (userRole === ROLES.TENANT_ADMIN) return true; // Tenant admins usually have all permissions within tenant

    const userPermissions = ROLE_PERMISSIONS[userRole as Role] || [];
    return requiredPermissions.some(permission => userPermissions.includes(permission as Permission));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userRole: string, requiredPermissions: string[]): boolean {
    if (userRole === ROLES.SUPER_ADMIN) return true;
    if (userRole === ROLES.TENANT_ADMIN) return true;

    const userPermissions = ROLE_PERMISSIONS[userRole as Role] || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission as Permission));
}

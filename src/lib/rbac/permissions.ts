/**
 * Role-Based Access Control (RBAC) System
 */

export enum Permission {
  // Product permissions
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  
  // Order permissions
  ORDER_VIEW = 'order:view',
  ORDER_CREATE = 'order:create',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_FULFILL = 'order:fulfill',
  
  // Customer permissions
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  
  // Inventory permissions
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_TRANSFER = 'inventory:transfer',
  
  // Financial permissions
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_MANAGE = 'financial:manage',
  PAYMENT_PROCESS = 'payment:process',
  
  // User management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Admin permissions
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_INTEGRATIONS = 'admin:integrations',
  ADMIN_REPORTS = 'admin:reports',
  ADMIN_FULL_ACCESS = 'admin:full',
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  SALES_PERSON = 'SALES_PERSON',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

// Role to permissions mapping
export const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  
  [Role.ADMIN]: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_FULFILL,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_TRANSFER,
    Permission.FINANCIAL_VIEW,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.ADMIN_SETTINGS,
    Permission.ADMIN_INTEGRATIONS,
    Permission.ADMIN_REPORTS,
  ],
  
  [Role.MANAGER]: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_FULFILL,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.FINANCIAL_VIEW,
    Permission.USER_VIEW,
    Permission.ADMIN_REPORTS,
  ],
  
  [Role.INVENTORY_MANAGER]: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_TRANSFER,
    Permission.ORDER_VIEW,
  ],
  
  [Role.SALES_PERSON]: [
    Permission.PRODUCT_VIEW,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.PAYMENT_PROCESS,
  ],
  
  [Role.ACCOUNTANT]: [
    Permission.ORDER_VIEW,
    Permission.CUSTOMER_VIEW,
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_MANAGE,
    Permission.PAYMENT_PROCESS,
    Permission.ADMIN_REPORTS,
  ],
  
  [Role.STAFF]: [
    Permission.PRODUCT_VIEW,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.INVENTORY_VIEW,
  ],
  
  [Role.VIEWER]: [
    Permission.PRODUCT_VIEW,
    Permission.ORDER_VIEW,
    Permission.CUSTOMER_VIEW,
    Permission.INVENTORY_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  return permissions.includes(permission);
}

/**
 * Check if a user has multiple permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a user has any of the permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return RolePermissions[role] || [];
}

/**
 * Check if role can perform action on resource
 */
export function canPerformAction(
  role: Role,
  resource: string,
  action: 'view' | 'create' | 'update' | 'delete'
): boolean {
  const permissionKey = `${resource}:${action}` as Permission;
  return hasPermission(role, permissionKey);
}


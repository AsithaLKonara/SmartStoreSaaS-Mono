import { UserRole } from '@prisma/client';

export type Permission = 
  | 'VIEW_ORDERS' | 'MANAGE_ORDERS' | 'DELETE_ORDERS'
  | 'VIEW_INVENTORY' | 'MANAGE_INVENTORY'
  | 'VIEW_REPORTS' | 'MANAGE_TENANT_SETTINGS'
  | 'POS_CHECKOUT' | 'POS_REFUND';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'VIEW_ORDERS', 'MANAGE_ORDERS', 'DELETE_ORDERS',
    'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_REPORTS', 'MANAGE_TENANT_SETTINGS',
    'POS_CHECKOUT', 'POS_REFUND'
  ],
  TENANT_ADMIN: [
    'VIEW_ORDERS', 'MANAGE_ORDERS', 'DELETE_ORDERS',
    'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_REPORTS', 'MANAGE_TENANT_SETTINGS',
    'POS_CHECKOUT', 'POS_REFUND'
  ],
  OWNER: [
    'VIEW_ORDERS', 'MANAGE_ORDERS', 'DELETE_ORDERS',
    'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_REPORTS', 'MANAGE_TENANT_SETTINGS',
    'POS_CHECKOUT', 'POS_REFUND'
  ],
  MANAGER: [
    'VIEW_ORDERS', 'MANAGE_ORDERS',
    'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_REPORTS',
    'POS_CHECKOUT', 'POS_REFUND'
  ],
  CASHIER: [
    'VIEW_ORDERS', 
    'POS_CHECKOUT'
  ],
  WAREHOUSE: [
    'VIEW_ORDERS', 'MANAGE_ORDERS',
    'VIEW_INVENTORY', 'MANAGE_INVENTORY'
  ],
  ACCOUNTANT: [
    'VIEW_ORDERS', 
    'VIEW_REPORTS'
  ],
  STAFF: [
    'VIEW_ORDERS',
    'VIEW_INVENTORY'
  ],
  CUSTOMER: []
};

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
  return permissions.includes(permission);
}

export function canAccessOrder(role: string | undefined | null): boolean {
  return hasPermission(role, 'VIEW_ORDERS');
}

export function canManageOrder(role: string | undefined | null): boolean {
  return hasPermission(role, 'MANAGE_ORDERS');
}

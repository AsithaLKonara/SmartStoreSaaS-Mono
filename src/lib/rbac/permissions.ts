/**
 * Role-Based Access Control (RBAC) System
 */

export enum Permission {
  // =========================
  // PRODUCT
  // =========================
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',

  // =========================
  // ORDER
  // =========================
  ORDER_VIEW = 'order:view',
  ORDER_CREATE = 'order:create',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_FULFILL = 'order:fulfill',

  // =========================
  // CUSTOMER
  // =========================
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',

  // =========================
  // INVENTORY
  // =========================
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_TRANSFER = 'inventory:transfer',

  // =========================
  // FINANCE
  // =========================
  FINANCIAL_VIEW = 'finance:view',
  FINANCIAL_MANAGE = 'finance:manage',
  PAYMENT_PROCESS = 'payment:process',

  // =========================
  // USER MANAGEMENT
  // =========================
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // =========================
  // ADMIN
  // =========================
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_INTEGRATIONS = 'admin:integrations',
  ADMIN_REPORTS = 'admin:reports',
  ADMIN_FULL_ACCESS = 'admin:full',

  // =========================
  // POS
  // =========================
  POS_USE_TERMINAL = 'pos:terminal',
  POS_PROCESS_PAYMENT = 'pos:payment',
  POS_REFUND = 'pos:refund',
  POS_APPLY_DISCOUNT = 'pos:discount',
  POS_MANAGE_SHIFT = 'pos:shift',
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  SALES_PERSON = 'SALES_PERSON',
  ACCOUNTANT = 'ACCOUNTANT',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER',
}

const ProductPermissions = [
  Permission.PRODUCT_VIEW,
  Permission.PRODUCT_CREATE,
  Permission.PRODUCT_UPDATE,
  Permission.PRODUCT_DELETE,
];

const OrderPermissions = [
  Permission.ORDER_VIEW,
  Permission.ORDER_CREATE,
  Permission.ORDER_UPDATE,
  Permission.ORDER_FULFILL,
];

const CustomerPermissions = [
  Permission.CUSTOMER_VIEW,
  Permission.CUSTOMER_CREATE,
  Permission.CUSTOMER_UPDATE,
];

const InventoryPermissions = [
  Permission.INVENTORY_VIEW,
  Permission.INVENTORY_UPDATE,
  Permission.INVENTORY_TRANSFER,
];

const POSPermissions = [
  Permission.POS_USE_TERMINAL,
  Permission.POS_PROCESS_PAYMENT,
  Permission.POS_REFUND,
  Permission.POS_APPLY_DISCOUNT,
  Permission.POS_MANAGE_SHIFT,
];

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),

  [Role.ADMIN]: [
    ...ProductPermissions,
    ...OrderPermissions,
    ...CustomerPermissions,
    ...InventoryPermissions,
    Permission.FINANCIAL_VIEW,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.ADMIN_SETTINGS,
    Permission.ADMIN_INTEGRATIONS,
    Permission.ADMIN_REPORTS,
    ...POSPermissions,
  ],

  [Role.MANAGER]: [
    ...ProductPermissions,
    ...OrderPermissions,
    ...CustomerPermissions,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.FINANCIAL_VIEW,
    Permission.ADMIN_REPORTS,
    ...POSPermissions,
  ],

  [Role.INVENTORY_MANAGER]: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    ...InventoryPermissions,
    Permission.ORDER_VIEW,
  ],

  [Role.SALES_PERSON]: [
    Permission.PRODUCT_VIEW,
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    ...CustomerPermissions,
    Permission.PAYMENT_PROCESS,
    Permission.POS_USE_TERMINAL,
    Permission.POS_PROCESS_PAYMENT,
    Permission.POS_APPLY_DISCOUNT,
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
    Permission.POS_USE_TERMINAL,
    Permission.POS_PROCESS_PAYMENT,
  ],

  [Role.VIEWER]: [
    Permission.PRODUCT_VIEW,
    Permission.ORDER_VIEW,
    Permission.CUSTOMER_VIEW,
    Permission.INVENTORY_VIEW,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function getRolePermissions(role: Role): Permission[] {
  return RolePermissions[role] || [];
}

export function canPerformAction(
  role: Role,
  resource: string,
  action: 'view' | 'create' | 'update' | 'delete'
): boolean {
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(role, permission);
}

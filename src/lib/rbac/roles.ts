// Role-Based Access Control (RBAC) System

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export enum StaffRoleTag {
  INVENTORY_MANAGER = 'inventory_manager',
  SALES_EXECUTIVE = 'sales_executive',
  FINANCE_OFFICER = 'finance_officer',
  MARKETING_MANAGER = 'marketing_manager',
  SUPPORT_AGENT = 'support_agent',
  HR_MANAGER = 'hr_manager'
}

export enum Permission {
  // Product permissions
  PRODUCT_CREATE = 'product.create',
  PRODUCT_READ = 'product.read',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',

  // Order permissions
  ORDER_CREATE = 'order.create',
  ORDER_READ = 'order.read',
  ORDER_UPDATE = 'order.update',
  ORDER_DELETE = 'order.delete',
  ORDER_CANCEL = 'order.cancel',

  // Customer permissions
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_READ = 'customer.read',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',

  // Finance permissions
  FINANCE_READ = 'finance.read',
  FINANCE_CREATE = 'finance.create',
  FINANCE_UPDATE = 'finance.update',
  FINANCE_DELETE = 'finance.delete',

  // Inventory permissions
  INVENTORY_READ = 'inventory.read',
  INVENTORY_UPDATE = 'inventory.update',
  INVENTORY_ADJUST = 'inventory.adjust',

  // User management
  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',

  // Reports
  REPORTS_VIEW = 'reports.view',
  REPORTS_EXPORT = 'reports.export',

  // Settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_UPDATE = 'settings.update',

  // Tenant management (Super Admin only)
  TENANT_CREATE = 'tenant.create',
  TENANT_READ = 'tenant.read',
  TENANT_UPDATE = 'tenant.update',
  TENANT_DELETE = 'tenant.delete',

  // Billing (Super Admin only)
  BILLING_VIEW = 'billing.view',
  BILLING_MANAGE = 'billing.manage'
}

// Role to Permissions mapping
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.TENANT_CREATE,
    Permission.TENANT_READ,
    Permission.TENANT_UPDATE,
    Permission.TENANT_DELETE,
    Permission.BILLING_VIEW,
    Permission.BILLING_MANAGE,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE
  ],

  [UserRole.TENANT_ADMIN]: [
    // Products
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    // Orders
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_CANCEL,
    // Customers
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    // Finance
    Permission.FINANCE_READ,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_UPDATE,
    Permission.FINANCE_DELETE,
    // Inventory
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_ADJUST,
    // Users
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE
  ],

  [UserRole.STAFF]: [
    // Default staff permissions (can be extended by roleTag)
    Permission.PRODUCT_READ,
    Permission.ORDER_READ,
    Permission.ORDER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.INVENTORY_READ,
    Permission.REPORTS_VIEW
  ],

  [UserRole.CUSTOMER]: [
    Permission.PRODUCT_READ,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ, // Own orders only
    Permission.CUSTOMER_UPDATE // Own profile only
  ]
};

// Staff role tag specific permissions
export const StaffRolePermissions: Record<StaffRoleTag, Permission[]> = {
  [StaffRoleTag.INVENTORY_MANAGER]: [
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_ADJUST,
    Permission.REPORTS_VIEW
  ],

  [StaffRoleTag.SALES_EXECUTIVE]: [
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.PRODUCT_READ
  ],

  [StaffRoleTag.FINANCE_OFFICER]: [
    Permission.FINANCE_READ,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_UPDATE,
    Permission.ORDER_READ,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT
  ],

  [StaffRoleTag.MARKETING_MANAGER]: [
    Permission.CUSTOMER_READ,
    Permission.PRODUCT_READ,
    Permission.REPORTS_VIEW,
    Permission.ORDER_READ
  ],

  [StaffRoleTag.SUPPORT_AGENT]: [
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE
  ],

  [StaffRoleTag.HR_MANAGER]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.REPORTS_VIEW
  ]
};

/**
 * Legacy Permission definitions (String-based)
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'VIEW_ALL_ORGANIZATIONS', 'MANAGE_ORGANIZATIONS', 'VIEW_SYSTEM_LOGS', 'MANAGE_SYSTEM_SETTINGS',
    'VIEW_AUDIT_LOGS', 'MANAGE_PACKAGES', 'VIEW_USERS', 'MANAGE_USERS', 'VIEW_BILLING', 'MANAGE_BILLING',
    'VIEW_SUBSCRIPTIONS', 'MANAGE_SUBSCRIPTIONS', 'VIEW_MONITORING', 'MANAGE_MONITORING',
    'VIEW_REALTIME', 'VIEW_NOTIFICATIONS', 'MANAGE_NOTIFICATIONS', 'VIEW_WEBHOOKS', 'MANAGE_WEBHOOKS',
    'VIEW_MARKETING', 'MANAGE_MARKETING', 'VIEW_AFFILIATES', 'MANAGE_AFFILIATES'
  ],
  TENANT_ADMIN: [
    'VIEW_USERS', 'MANAGE_USERS', 'VIEW_PRODUCTS', 'MANAGE_PRODUCTS', 'VIEW_ORDERS',
    'MANAGE_ORDERS', 'VIEW_CUSTOMERS', 'MANAGE_CUSTOMERS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_AI_INSIGHTS', 'VIEW_SETTINGS', 'MANAGE_SETTINGS',
    'VIEW_BILLING', 'MANAGE_BILLING', 'VIEW_ORGANIZATION', 'MANAGE_ORGANIZATION_SETTINGS',
    'VIEW_SUPPORT', 'MANAGE_SUPPORT', 'CREATE_SUPPORT_TICKET', 'VIEW_WEBHOOKS', 'MANAGE_WEBHOOKS',
    'VIEW_MARKETING', 'MANAGE_MARKETING', 'VIEW_CAMPAIGNS', 'MANAGE_CAMPAIGNS', 'VIEW_INTEGRATIONS',
    'MANAGE_INTEGRATIONS', 'VIEW_LOYALTY', 'MANAGE_LOYALTY', 'VIEW_AFFILIATES', 'MANAGE_AFFILIATES',
    'VIEW_SUBSCRIPTIONS', 'MANAGE_SUBSCRIPTIONS', 'VIEW_REALTIME', 'VIEW_NOTIFICATIONS',
    'MANAGE_NOTIFICATIONS', 'VIEW_PURCHASE_ORDERS', 'MANAGE_PURCHASE_ORDERS', 'VIEW_SHIPPING_STATS',
    'MANAGE_AI'
  ],
  STAFF: [
    'VIEW_ASSIGNED_PRODUCTS', 'VIEW_ASSIGNED_CUSTOMERS', 'VIEW_ASSIGNED_INVENTORY',
    'VIEW_ORDERS', 'CREATE_ORDERS', 'VIEW_SUPPORT', 'CREATE_SUPPORT_TICKET'
  ],
  CUSTOMER: [
    'VIEW_OWN_ORDERS', 'VIEW_BILLING_INFO', 'CREATE_SUPPORT_TICKET', 'VIEW_OWN_SUPPORT_TICKETS'
  ]
};

// Permission checking functions
export function hasPermission(role: UserRole | string, permission: Permission | string, roleTag?: string): boolean {
  // Handle Legacy String-based Permissions
  if (typeof permission === 'string' && !Object.values(Permission).includes(permission as Permission)) {
    const permissions = ROLE_PERMISSIONS[role as string] || [];

    // Staff legacy permissions depend on roleTag
    if ((role === UserRole.STAFF || role === 'STAFF') && roleTag) {
      const staffPermissions: Record<string, string[]> = {
        sales_staff: ['VIEW_PRODUCTS', 'VIEW_ORDERS', 'CREATE_ORDERS', 'VIEW_CUSTOMERS'],
        inventory_manager: ['VIEW_PRODUCTS', 'MANAGE_PRODUCTS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY'],
        customer_service: ['VIEW_CUSTOMERS', 'VIEW_ORDERS', 'UPDATE_ORDERS', 'MANAGE_CUSTOMERS'],
        accountant: ['VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_BILLING']
      };
      const tagPermissions = staffPermissions[roleTag] || [];
      if (tagPermissions.includes(permission)) return true;
    }

    return permissions.includes(permission);
  }

  // Check role-based enum permissions
  const rolePerms = RolePermissions[role as UserRole] || [];
  if (rolePerms.includes(permission as Permission)) {
    return true;
  }

  // Check staff role tag enum permissions
  if ((role === UserRole.STAFF || role === 'STAFF') && roleTag) {
    const staffPerms = StaffRolePermissions[roleTag as StaffRoleTag] || [];
    if (staffPerms.includes(permission as Permission)) {
      return true;
    }
  }

  return false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[], roleTag?: string): boolean {
  return permissions.some(perm => hasPermission(role, perm, roleTag));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[], roleTag?: string): boolean {
  return permissions.every(perm => hasPermission(role, perm, roleTag));
}

export function canAccessRoute(role: UserRole, route: string, roleTag?: string): boolean {
  // Route to permission mapping
  const routePermissions: Record<string, Permission[]> = {
    '/products': [Permission.PRODUCT_READ],
    '/products/new': [Permission.PRODUCT_CREATE],
    '/orders': [Permission.ORDER_READ],
    '/orders/new': [Permission.ORDER_CREATE],
    '/customers': [Permission.CUSTOMER_READ],
    '/customers/new': [Permission.CUSTOMER_CREATE],
    '/inventory': [Permission.INVENTORY_READ],
    '/accounting': [Permission.FINANCE_READ],
    '/reports': [Permission.REPORTS_VIEW],
    '/settings': [Permission.SETTINGS_VIEW],
    '/tenants': [Permission.TENANT_READ],
    '/admin': [Permission.TENANT_READ, Permission.BILLING_VIEW],
    '/procurement': [Permission.PRODUCT_READ, Permission.INVENTORY_READ]
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) {
    return true; // Allow access to routes without specific permissions
  }

  return hasAnyPermission(role, requiredPermissions, roleTag);
}

// Get user-accessible routes
export function getAccessibleRoutes(role: UserRole, roleTag?: string): string[] {
  const allRoutes = [
    '/dashboard',
    '/products',
    '/orders',
    '/customers',
    '/inventory',
    '/accounting',
    '/reports',
    '/settings',
    '/procurement',
    '/shipping',
    '/marketing',
    '/tenants',
    '/admin',
    '/audit',
    '/backup'
  ];

  return allRoutes.filter(route => canAccessRoute(role, route, roleTag));
}


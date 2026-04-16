import rolePermissionsData from './role-permissions.json';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',

  // New roles
  // New roles
  SALES_STAFF = 'SALES_STAFF',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  ACCOUNTANT = 'ACCOUNTANT',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  POS_OPERATOR = 'POS_OPERATOR'
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
  // System & Support
  SYSTEM_READ = 'system.read',
  SYSTEM_MANAGE = 'system.manage',
  MONITORING_READ = 'monitoring.read',
  LOGS_READ = 'logs.read',
  BACKUP_MANAGE = 'backup.manage',

  // Product permissions
  PRODUCT_CREATE = 'products.create',
  PRODUCT_READ = 'products.read',
  PRODUCT_UPDATE = 'products.update',
  PRODUCT_DELETE = 'products.delete',

  // Order permissions
  ORDER_CREATE = 'orders.create',
  ORDER_READ = 'orders.read',
  ORDER_UPDATE = 'orders.update',
  ORDER_DELETE = 'orders.delete',
  ORDER_CANCEL = 'orders.cancel',

  // Customer permissions
  CUSTOMER_CREATE = 'customers.create',
  CUSTOMER_READ = 'customers.read',
  CUSTOMER_UPDATE = 'customers.update',
  CUSTOMER_DELETE = 'customers.delete',

  // Inventory & Warehouse
  INVENTORY_READ = 'inventory.read',
  INVENTORY_UPDATE = 'inventory.manage',
  INVENTORY_MANAGE = 'inventory.manage',
  WAREHOUSE_MANAGE = 'warehouse.manage',

  // Finance & Accounting
  ACCOUNTING_MANAGE = 'accounting.manage',
  ACCOUNTING_READ = 'accounting.read',
  FINANCE_READ = 'accounting.read',
  FINANCE_MANAGE = 'accounting.manage',

  // Procurement
  PROCUREMENT_MANAGE = 'procurement.manage',

  // Logistics
  SHIPPING_MANAGE = 'shipping.manage',
  RETURNS_MANAGE = 'returns.manage',

  // Marketing & Campaigns
  MARKETING_MANAGE = 'marketing.manage',
  CAMPAIGNS_READ = 'marketing.manage',
  CAMPAIGNS_MANAGE = 'marketing.manage',

  // Analytics & AI
  ANALYTICS_READ = 'analytics.read',
  VIEW_ANALYTICS = 'analytics.read',
  AI_READ = 'ai.read',
  AI_MANAGE = 'ai.manage',
  AI_CREATE = 'ai.manage',
  AI_UPDATE = 'ai.manage',

  // User management
  USER_CREATE = 'users.create',
  USER_READ = 'users.read',
  USER_UPDATE = 'users.update',
  USER_DELETE = 'users.delete',
  ROLES_MANAGE = 'roles.manage',

  // Tenant management
  TENANT_CREATE = 'tenants.create',
  TENANT_READ = 'tenants.read',
  TENANT_UPDATE = 'tenants.update',
  TENANT_DELETE = 'tenants.delete',
  TENANT_IMPERSONATE = 'tenants.impersonate',

  // Settings & Integrations
  SETTINGS_MANAGE = 'settings.manage',
  INTEGRATIONS_MANAGE = 'integrations.manage',

  // Reports
  REPORTS_READ = 'reports.read',
  REPORTS_VIEW = 'reports.read',

  // Billing
  BILLING_READ = 'billing.read',
  BILLING_MANAGE = 'billing.manage',

  // Webhooks
  WEBHOOKS_READ = 'webhooks.read',
  WEBHOOKS_MANAGE = 'webhooks.manage',

  // Support
  SUPPORT_READ = 'support.read',
  SUPPORT_CREATE = 'support.create',
  SUPPORT_MANAGE = 'support.manage',

  // Review & Rating
  REVIEWS_READ = 'reviews.read',
  REVIEWS_MANAGE = 'reviews.manage',

  // Compliance & Audit
  COMPLIANCE_READ = 'compliance.read',
  COMPLIANCE_MANAGE = 'compliance.manage',
  AUDIT_READ = 'audit.read',
  AUDIT_MANAGE = 'audit.manage',

  // IoT & Devices
  IOT_READ = 'iot.read',
  IOT_MANAGE = 'iot.manage',

  // Subscriptions
  SUBSCRIPTIONS_READ = 'subscriptions.read',
  SUBSCRIPTIONS_MANAGE = 'subscriptions.manage',

  // POS
  POS_READ = 'pos.read',
  POS_MANAGE = 'pos.manage',

  // Notifications
  NOTIFICATIONS_READ = 'notifications.read',
  NOTIFICATIONS_MANAGE = 'notifications.manage'
}

// Ensure smooth compilation of any outside files that may have used these exact exports
export const RolePermissions: Record<string, Permission[]> = {};
export const StaffRolePermissions: Record<string, Permission[]> = {};
export const ROLE_PERMISSIONS: Record<string, string[]> = {};

// Parse roles from the new JSON schema
const jsonRoles = rolePermissionsData.roles.reduce((acc: Record<string, string[]>, roleObj: any) => {
  acc[roleObj.id] = roleObj.permissions;
  return acc;
}, {});

// Mapping legacy STAFF + roleTag to the new flat roles
function getEffectiveRole(role: string, roleTag?: string): string {
  if (role === UserRole.STAFF || role === 'STAFF') {
    if (roleTag === StaffRoleTag.INVENTORY_MANAGER || roleTag === 'inventory_manager') return 'INVENTORY_MANAGER';
    if (roleTag === StaffRoleTag.SALES_EXECUTIVE || roleTag === 'sales_staff' || roleTag === 'sales_executive') return 'SALES_STAFF';
    if (roleTag === StaffRoleTag.SUPPORT_AGENT || roleTag === 'customer_service' || roleTag === 'support_agent') return 'CUSTOMER_SUPPORT';
    return 'STAFF'; // Unmapped generic staff
  }
  return role;
}

export function hasPermission(role: UserRole | string, permission: Permission | string, roleTag?: string): boolean {
  // SUPER_ADMIN bypasses all permission checks
  if (role === UserRole.SUPER_ADMIN || role === 'SUPER_ADMIN') return true;

  const effectiveRole = getEffectiveRole(role as string, roleTag);
  const schemaPermissions = jsonRoles[effectiveRole] || [];

  return hasImplicitPermission(schemaPermissions, permission as string);
}

export function hasAnyPermission(role: UserRole | string, permissions: (Permission | string)[], roleTag?: string): boolean {
  return permissions.some(perm => hasPermission(role, perm, roleTag));
}

export function hasAllPermissions(role: UserRole | string, permissions: (Permission | string)[], roleTag?: string): boolean {
  return permissions.every(perm => hasPermission(role, perm, roleTag));
}

export function hasImplicitPermission(schemaPermissions: string[], reqPerm: string): boolean {
  if (schemaPermissions.includes(reqPerm)) return true;

  if (reqPerm.endsWith(':read')) {
    const resource = reqPerm.split(':')[0];
    if (schemaPermissions.includes(`${resource}:manage`) ||
      schemaPermissions.includes(`${resource}:update`) ||
      schemaPermissions.includes(`${resource}:create`)) {
      return true;
    }
  }
  return false;
}

export function canAccessRoute(role: UserRole | string, route: string, roleTag?: string): boolean {
  const effectiveRole = getEffectiveRole(role as string, roleTag);
  const schemaPermissions = jsonRoles[effectiveRole] || [];

  const roleObj = rolePermissionsData.roles.find((r: any) => r.id === effectiveRole);

  // Specific constraints based on role level
  if (roleObj) {
    if (roleObj.level === 'portal' && route.startsWith('/dashboard')) {
      return false;
    }
    if (roleObj.level === 'tenant' && route.startsWith('/admin')) {
      return false; // Typically /admin is platform level
    }
  }

  const routePermissionsArray: {route: string, permission: string}[] = (rolePermissionsData as any).routePermissions || [];

  // Match routes including basic dynamic params like :id
  for (const routeRule of routePermissionsArray) {
    // Escape string and turn dynamic sections like :id into greedy captures for paths
    const pattern = '^' + routeRule.route.replace(/:[^\s/]+/g, '[^/]+') + '$';
    const regex = new RegExp(pattern);
    if (regex.test(route)) {
      return hasImplicitPermission(schemaPermissions, routeRule.permission);
    }
  }

  // Fallback for generic uncaught routes
  const legacyRoutePermissions: Record<string, string[]> = {
    '/products': ['products:read'],
    '/products/new': ['products:create'],
    '/orders': ['orders:read'],
    '/admin': ['tenants:read', 'billing:read']
  };

  const reqPerms = legacyRoutePermissions[route];
  if (!reqPerms) {
    return true; // Allow unrestricted generic routes
  }

  return reqPerms.some(reqPerm => hasImplicitPermission(schemaPermissions, reqPerm));
}

export function getAccessibleRoutes(role: UserRole | string, roleTag?: string): string[] {
  const routePermissionsArray: {route: string, permission: string}[] = (rolePermissionsData as any).routePermissions || [];
  const allRoutes = routePermissionsArray.map(rp => rp.route);

  // Also include baseline older pages which might not be fully migrated
  const baselineRoutes = [
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

  const combined = Array.from(new Set([...allRoutes, ...baselineRoutes]));
  return combined.filter(route => canAccessRoute(role, route, roleTag));
}

import { useSession } from 'next-auth/react';

export const usePermissions = () => {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const roleTag = (session?.user as any)?.roleTag;

  const can = (permission: string): boolean => {
    if (!userRole) return false;

    // Super Admin has all permissions
    if (userRole === 'SUPER_ADMIN') return true;

    // Tenant Admin has most permissions except system-level ones
    if (userRole === 'TENANT_ADMIN') {
      const restrictedPermissions = ['manage_system', 'manage_tenants', 'view_all_tenants'];
      return !restrictedPermissions.includes(permission);
    }

    // Staff permissions based on roleTag
    if (userRole === 'STAFF') {
      const staffPermissions: Record<string, string[]> = {
        inventory_manager: ['view_products', 'manage_products', 'view_inventory', 'manage_inventory'],
        sales_executive: ['view_products', 'view_orders', 'manage_orders', 'view_customers'],
        finance_officer: ['view_orders', 'view_payments', 'manage_payments', 'view_reports'],
        marketing_manager: ['view_customers', 'manage_campaigns', 'view_analytics'],
        support_agent: ['view_customers', 'view_orders', 'manage_tickets'],
        hr_manager: ['view_users', 'manage_users']
      };
      return staffPermissions[roleTag || '']?.includes(permission) || false;
    }

    // Customers have very limited permissions
    if (userRole === 'CUSTOMER') {
      return ['view_products', 'manage_own_orders', 'view_own_profile'].includes(permission);
    }

    return false;
  };

  const canManage = (resource: string): boolean => {
    return can(`manage_${resource}`);
  };

  const canView = (resource: string): boolean => {
    return can(`view_${resource}`);
  };

  return {
    can,
    canManage,
    canView,
    isSuperAdmin: userRole === 'SUPER_ADMIN',
    isTenantAdmin: userRole === 'TENANT_ADMIN',
    isStaff: userRole === 'STAFF',
    isCustomer: userRole === 'CUSTOMER',
    roleTag
  };
};


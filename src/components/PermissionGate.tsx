import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate = ({ permission, children, fallback = null }: PermissionGateProps) => {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const RoleGate = ({ 
  roles, 
  children, 
  fallback = null 
}: { 
  roles: string[]; 
  children: ReactNode; 
  fallback?: ReactNode;
}) => {
  const { isSuperAdmin, isTenantAdmin, isStaff, isCustomer } = usePermissions();

  const hasRole = roles.some(role => {
    if (role === 'SUPER_ADMIN') return isSuperAdmin;
    if (role === 'TENANT_ADMIN') return isTenantAdmin;
    if (role === 'STAFF') return isStaff;
    if (role === 'CUSTOMER') return isCustomer;
    return false;
  });

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};


'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate = ({ permission, children, fallback = null }: PermissionGateProps) => {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  // Simple permission check - Super Admin and Tenant Admin can do most things
  const canAccess = userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN';

  if (!canAccess) {
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
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const hasRole = roles.includes(userRole);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};


'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, Permission } from '@/lib/rbac/roles';

interface PermissionGuardProps {
  permission: Permission | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable';
}

/**
 * PermissionGuard
 * 
 * High-fidelity governance component that wraps interactive elements to enforce
 * tenant-level RBAC constraints. Supports "hide" and "disable" modes.
 */
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null, 
  mode = 'hide' 
}: PermissionGuardProps) {
  const { data: session } = useSession();

  const isAuthorized = session?.user?.role 
    ? hasPermission(session.user.role as any, permission as any, (session.user as any).roleTag)
    : false;

  if (isAuthorized) {
    return <>{children}</>;
  }

  if (mode === 'disable') {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { 
          disabled: true,
          title: 'Insufficient permissions for this action'
        });
      }
      return child;
    });
  }

  return <>{fallback}</>;
}

'use client';

import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleProtectedPageProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAll?: boolean; // If true, user must have ALL specified roles
  fallbackPath?: string; // Where to redirect if unauthorized
  showUnauthorized?: boolean; // Show unauthorized message instead of redirecting
}

export function RoleProtectedPage({
  children,
  allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'],
  requireAll = false,
  fallbackPath = '/dashboard',
  showUnauthorized = false,
}: RoleProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect to login if not authenticated
    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user has required role
    if (allowedRoles && allowedRoles.length > 0) {
      const hasRole = requireAll
        ? allowedRoles.every((role) => userRole === role)
        : allowedRoles.includes(userRole);

      if (!hasRole && !showUnauthorized) {
        router.push(fallbackPath);
      }
    }
  }, [session, status, router, userRole, allowedRoles, requireAll, fallbackPath, showUnauthorized]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  // Check authorization
  const hasRole = allowedRoles && allowedRoles.length > 0
    ? requireAll
      ? allowedRoles.every((role) => userRole === role)
      : allowedRoles.includes(userRole)
    : true;

  // Unauthorized
  if (!hasRole) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center max-w-md mx-auto p-8">
            <Shield className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-red-400 font-medium mb-1">Insufficient Permissions</p>
                  <p className="text-gray-400 text-sm">
                    You don&apos;t have the required permissions to access this page.
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Your role: <span className="text-blue-400">{userRole}</span>
                    <br />
                    Required: <span className="text-blue-400">{allowedRoles.join(' or ')}</span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(fallbackPath)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return null; // Redirect will happen in useEffect
  }

  // Authorized - render children
  return <>{children}</>;
}

// Convenience wrappers for specific roles
export function SuperAdminOnly({ children, ...props }: { children: ReactNode; showUnauthorized?: boolean }) {
  return (
    <RoleProtectedPage allowedRoles={['SUPER_ADMIN']} {...props}>
      {children}
    </RoleProtectedPage>
  );
}

export function AdminOnly({ children, ...props }: { children: ReactNode; showUnauthorized?: boolean }) {
  return (
    <RoleProtectedPage allowedRoles={['SUPER_ADMIN', 'TENANT_ADMIN']} {...props}>
      {children}
    </RoleProtectedPage>
  );
}

export function StaffOrAbove({ children, ...props }: { children: ReactNode; showUnauthorized?: boolean }) {
  return (
    <RoleProtectedPage allowedRoles={['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF']} {...props}>
      {children}
    </RoleProtectedPage>
  );
}

export function AllRoles({ children }: { children: ReactNode }) {
  return (
    <RoleProtectedPage allowedRoles={['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF', 'CUSTOMER']}>
      {children}
    </RoleProtectedPage>
  );
}


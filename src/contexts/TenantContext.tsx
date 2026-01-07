'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

interface TenantContextType {
  organizationId: string | null;
  organizationName: string | null;
  canSwitchTenant: boolean;
  switchTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType>({
  organizationId: null,
  organizationName: null,
  canSwitchTenant: false,
  switchTenant: () => {}
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      // @ts-ignore
      setOrganizationId(session.user.organizationId || null);
      // @ts-ignore
      setOrganizationName(session.user.organizationName || null);
    }
  }, [session]);

  const canSwitchTenant = session?.user?.role === 'SUPER_ADMIN';

  const switchTenant = async (tenantId: string) => {
    if (!canSwitchTenant) {
      logger.error({
        message: 'Unauthorized tenant switch attempt',
        context: { tenantId, userId: session?.user?.id }
      });
      return;
    }
    
    try {
      const response = await fetch('/api/tenants/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      });
      
      if (response.ok) {
        // Reload session to get new tenant context
        window.location.reload();
      }
    } catch (error) {
      logger.error({
        message: 'Failed to switch tenant',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { tenantId, userId: session?.user?.id }
      });
    }
  };

  return (
    <TenantContext.Provider value={{
      organizationId,
      organizationName,
      canSwitchTenant,
      switchTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);


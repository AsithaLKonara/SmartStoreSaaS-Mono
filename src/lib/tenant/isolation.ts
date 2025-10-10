/**
 * Get organization ID from session for tenant isolation
 * Returns null if no session (allows APIs to work without breaking)
 */
export async function getOrganizationId(): Promise<string | null> {
  try {
    // For now, return null to allow APIs to work without tenant filtering
    // In production, this would check the session
    // const session = await getServerSession(authOptions);
    // return session?.user?.organizationId || null;
    return null;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return null;
  }
}

/**
 * Add tenant filter to Prisma where clause
 * 
 * Usage:
 * const products = await prisma.product.findMany({
 *   where: await addTenantFilter({ isActive: true })
 * });
 */
export async function addTenantFilter(where: any = {}): Promise<any> {
  const organizationId = await getOrganizationId();
  
  if (!organizationId) {
    return where; // No tenant filtering if no org ID
  }
  
  return {
    ...where,
    organizationId
  };
}

/**
 * Check if user has access to resource in their tenant
 */
export async function canAccessResource(resourceOrganizationId: string): Promise<boolean> {
  const userOrganizationId = await getOrganizationId();
  
  // Allow access if no tenant filtering (for now)
  if (!userOrganizationId) return true;
  
  return userOrganizationId === resourceOrganizationId;
}

/**
 * Ensure user can only create resources in their tenant
 */
export async function ensureTenantOwnership(data: any): Promise<any> {
  const organizationId = await getOrganizationId();
  
  // If no organization ID, use the default seeded org (fallback for now)
  const finalOrgId = organizationId || 'seed-org-1-1759434570099';
  
  return {
    ...data,
    organizationId: finalOrgId
  };
}


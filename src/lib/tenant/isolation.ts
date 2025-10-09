import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get organization ID from session for tenant isolation
 */
export async function getOrganizationId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    
    // @ts-ignore
    return session.user.organizationId || null;
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
  
  if (!userOrganizationId) return false;
  
  // Super admin can access all
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (session?.user?.role === 'SUPER_ADMIN') return true;
  
  return userOrganizationId === resourceOrganizationId;
}

/**
 * Ensure user can only create resources in their tenant
 */
export async function ensureTenantOwnership(data: any): Promise<any> {
  const organizationId = await getOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization context');
  }
  
  return {
    ...data,
    organizationId
  };
}


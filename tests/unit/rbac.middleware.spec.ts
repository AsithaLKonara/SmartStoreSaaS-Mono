import { 
  getOrganizationScope, 
  validateOrganizationAccess, 
  UserRole
} from '@/lib/rbac/middleware';

describe('RBAC Middleware Unit Tests', () => {
  describe('getOrganizationScope', () => {
    it('should return fallback organizationId for SUPER_ADMIN when no active org provided', () => {
      const user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.SUPER_ADMIN,
        organizationId: 'org-fallback',
        activeOrganizationId: null
      } as any;

      const result = getOrganizationScope(user);
      expect(result).toBe('org-fallback');
    });

    it('should prioritize activeOrganizationId for SUPER_ADMIN', () => {
      const user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.SUPER_ADMIN,
        organizationId: 'org-fallback',
        activeOrganizationId: 'org-active'
      } as any;

      const result = getOrganizationScope(user);
      expect(result).toBe('org-active');
    });

    it('should return organizationId for TENANT_ADMIN', () => {
      const user = {
        id: 'user-2',
        email: 'tenant@test.com',
        role: UserRole.TENANT_ADMIN,
        organizationId: 'org-2'
      } as any;

      const result = getOrganizationScope(user);
      expect(result).toBe('org-2');
    });

    it('should throw error for non-SUPER_ADMIN without organizationId', () => {
      const user = {
        id: 'user-3',
        email: 'staff@test.com',
        role: UserRole.STAFF,
        organizationId: null
      } as any;

      expect(() => getOrganizationScope(user)).toThrow('User does not belong to an organization');
    });
  });

  describe('validateOrganizationAccess', () => {
    it('should allow SUPER_ADMIN to access any organization', () => {
      const user = { role: UserRole.SUPER_ADMIN } as any;
      expect(validateOrganizationAccess(user, 'any-org')).toBe(true);
    });

    it('should allow TENANT_ADMIN to access their own organization', () => {
      const user = { role: UserRole.TENANT_ADMIN, organizationId: 'my-org' } as any;
      expect(validateOrganizationAccess(user, 'my-org')).toBe(true);
    });

    it('should deny TENANT_ADMIN access to another organization', () => {
      const user = { role: UserRole.TENANT_ADMIN, organizationId: 'my-org' } as any;
      expect(validateOrganizationAccess(user, 'other-org')).toBe(false);
    });
  });
});

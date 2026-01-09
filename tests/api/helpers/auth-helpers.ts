/**
 * Authentication Helpers for API Testing
 * 
 * Provides utilities for creating authenticated requests and test users
 */

import { AuthenticatedUser } from '@/lib/middleware/auth';

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'STAFF' | 'CUSTOMER';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTag?: string;
  organizationId: string;
}

/**
 * Create a test user object
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: overrides?.id || `test-user-${Date.now()}`,
    email: overrides?.email || `test-${Date.now()}@example.com`,
    name: overrides?.name || 'Test User',
    role: overrides?.role || 'TENANT_ADMIN',
    roleTag: overrides?.roleTag,
    organizationId: overrides?.organizationId || `test-org-${Date.now()}`
  };
}

/**
 * Create test users for all roles
 */
export function createTestUsersForAllRoles(organizationId: string = 'test-org-1'): Record<UserRole, TestUser> {
  return {
    SUPER_ADMIN: createTestUser({
      role: 'SUPER_ADMIN',
      email: 'superadmin@test.com',
      organizationId
    }),
    TENANT_ADMIN: createTestUser({
      role: 'TENANT_ADMIN',
      email: 'tenantadmin@test.com',
      organizationId
    }),
    STAFF: createTestUser({
      role: 'STAFF',
      email: 'staff@test.com',
      roleTag: 'sales_staff',
      organizationId
    }),
    CUSTOMER: createTestUser({
      role: 'CUSTOMER',
      email: 'customer@test.com',
      organizationId
    })
  };
}

/**
 * Create test users for different organizations (for multi-tenant testing)
 */
export function createTestUsersForDifferentOrgs(): {
  org1: Record<UserRole, TestUser>;
  org2: Record<UserRole, TestUser>;
} {
  return {
    org1: createTestUsersForAllRoles('org-1'),
    org2: createTestUsersForAllRoles('org-2')
  };
}

/**
 * Convert test user to AuthenticatedUser format
 */
export function toAuthenticatedUser(testUser: TestUser): AuthenticatedUser {
  return {
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
    role: testUser.role,
    roleTag: testUser.roleTag,
    organizationId: testUser.organizationId
  };
}

/**
 * Generate JWT token for test user (mock implementation)
 * In real tests, this would use the actual auth system
 */
export function generateTestToken(user: TestUser): string {
  // Mock token - in real implementation, use actual JWT signing
  return `mock-token-${user.id}-${Date.now()}`;
}

/**
 * Create authorization header for test requests
 */
export function createAuthHeader(user: TestUser): { Authorization: string } {
  const token = generateTestToken(user);
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Create request headers with authentication and correlation ID
 */
export function createTestHeaders(user: TestUser, correlationId?: string): Record<string, string> {
  return {
    ...createAuthHeader(user),
    'Content-Type': 'application/json',
    'X-Request-Id': correlationId || `test-${Date.now()}`,
    'X-Correlation-ID': correlationId || `test-${Date.now()}`
  };
}

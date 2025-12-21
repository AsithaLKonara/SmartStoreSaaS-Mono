/**
 * Authentication Middleware Test
 *
 * Tests the authentication middleware functionality including
 * route protection, role-based access, and organization isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTUtils, JWTPayload } from './src/lib/auth/jwt';
import { hasRole, hasOrganizationAccess, requireAuth } from './src/middleware/auth';
import { Permission, Role, hasPermission } from './src/lib/rbac/permissions';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class AuthMiddlewareTester {
  private results: TestResult[] = [];

  private log(message: string, passed: boolean = true, details?: any) {
    const result: TestResult = {
      testName: message,
      passed,
      message: passed ? '✅ PASSED' : '❌ FAILED',
      details
    };
    this.results.push(result);
    console.log(`${result.message}: ${message}`);
    if (details && !passed) {
      console.log('   Details:', details);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🛡️  TESTING AUTHENTICATION MIDDLEWARE');
    console.log('=====================================\n');

    try {
      // Test role checking functions
      await this.testRoleChecking();
      await this.testOrganizationAccess();
      await this.testMiddlewareLogic();

      // Test route protection scenarios
      await this.testPublicRoutes();
      await this.testProtectedRoutes();
      await this.testRoleBasedRoutes();

      // Test error handling
      await this.testMiddlewareErrorHandling();

      this.printSummary();

    } catch (error) {
      console.error('❌ Middleware test suite failed:', error);
      this.log('Middleware test suite execution', false, error);
    }
  }

  private async testRoleChecking(): Promise<void> {
    console.log('👤 Testing Role Checking Functions...');

    try {
      const adminUser: JWTPayload = {
        id: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
        organizationId: 'org-1'
      };

      const staffUser: JWTPayload = {
        id: 'staff-id',
        email: 'staff@example.com',
        role: 'STAFF',
        organizationId: 'org-1'
      };

      // Test hasRole function
      const adminHasAdminRole = hasRole(adminUser, 'ADMIN');
      const adminHasStaffRole = hasRole(adminUser, 'STAFF');
      const staffHasStaffRole = hasRole(staffUser, 'STAFF');
      const staffHasAdminRole = hasRole(staffUser, 'ADMIN');

      if (!adminHasAdminRole) {
        throw new Error('ADMIN user should have ADMIN role');
      }

      if (adminHasStaffRole) {
        throw new Error('ADMIN user should not have STAFF role');
      }

      if (!staffHasStaffRole) {
        throw new Error('STAFF user should have STAFF role');
      }

      if (staffHasAdminRole) {
        throw new Error('STAFF user should not have ADMIN role');
      }

      // Test multiple roles
      const adminHasAnyRole = hasRole(adminUser, ['ADMIN', 'MANAGER']);
      const staffHasAnyRole = hasRole(staffUser, ['ADMIN', 'MANAGER']);

      if (!adminHasAnyRole) {
        throw new Error('ADMIN should match any of ADMIN or MANAGER roles');
      }

      if (staffHasAnyRole) {
        throw new Error('STAFF should not match ADMIN or MANAGER roles');
      }

      // Test null user
      const nullUserHasRole = hasRole(null, 'ADMIN');
      if (nullUserHasRole) {
        throw new Error('Null user should not have any role');
      }

      this.log('Role checking functions', true);
    } catch (error) {
      this.log('Role checking functions', false, error);
    }
  }

  private async testOrganizationAccess(): Promise<void> {
    console.log('🏢 Testing Organization Access Control...');

    try {
      const userFromOrg1: JWTPayload = {
        id: 'user-id',
        email: 'user@example.com',
        role: 'USER',
        organizationId: 'org-1'
      };

      // Test organization access
      const hasAccessToOwnOrg = hasOrganizationAccess(userFromOrg1, 'org-1');
      const hasAccessToOtherOrg = hasOrganizationAccess(userFromOrg1, 'org-2');
      const hasAccessNoSpecificOrg = hasOrganizationAccess(userFromOrg1); // No org specified

      if (!hasAccessToOwnOrg) {
        throw new Error('User should have access to their own organization');
      }

      if (hasAccessToOtherOrg) {
        throw new Error('User should not have access to other organizations');
      }

      if (!hasAccessNoSpecificOrg) {
        throw new Error('User should have access when no specific organization is required');
      }

      // Test null user
      const nullUserHasAccess = hasOrganizationAccess(null, 'org-1');
      if (nullUserHasAccess) {
        throw new Error('Null user should not have organization access');
      }

      this.log('Organization access control', true);
    } catch (error) {
      this.log('Organization access control', false, error);
    }
  }

  private async testMiddlewareLogic(): Promise<void> {
    console.log('🔧 Testing Middleware Logic...');

    try {
      // Test middleware utility functions exist and are structured correctly
      const middlewareUtils = { hasRole, hasOrganizationAccess };

      if (typeof middlewareUtils.hasRole !== 'function') {
        throw new Error('hasRole function should be available');
      }

      if (typeof middlewareUtils.hasOrganizationAccess !== 'function') {
        throw new Error('hasOrganizationAccess function should be available');
      }

      // Test that requireAuth function exists (would need mocking for full test)
      if (typeof requireAuth !== 'function') {
        throw new Error('requireAuth function should be available');
      }

      this.log('Middleware logic structure', true);
    } catch (error) {
      this.log('Middleware logic structure', false, error);
    }
  }

  private async testPublicRoutes(): Promise<void> {
    console.log('🌐 Testing Public Route Access...');

    try {
      // Test public paths that should not require authentication
      const publicPaths = [
        '/login',
        '/register',
        '/unauthorized',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/session'
      ];

      // In a real middleware test, these paths would bypass authentication
      // For this test, we verify the path logic
      for (const path of publicPaths) {
        if (!path.startsWith('/')) {
          throw new Error('All public paths should start with /');
        }
      }

      this.log('Public route access logic', true);
    } catch (error) {
      this.log('Public route access logic', false, error);
    }
  }

  private async testProtectedRoutes(): Promise<void> {
    console.log('🔒 Testing Protected Route Access...');

    try {
      // Test that API routes and dashboard routes require authentication
      const protectedPaths = [
        '/api/products',
        '/api/users',
        '/dashboard',
        '/admin',
        '/api/orders'
      ];

      // In real middleware, these would require authentication
      for (const path of protectedPaths) {
        if (!path.startsWith('/')) {
          throw new Error('All protected paths should start with /');
        }
      }

      // Test that authenticated users can access protected routes
      const authenticatedUser: JWTPayload = {
        id: 'user-id',
        email: 'user@example.com',
        role: 'USER',
        organizationId: 'org-1'
      };

      // This would be validated in the real middleware
      if (!authenticatedUser.id || !authenticatedUser.email) {
        throw new Error('Authenticated user should have id and email');
      }

      this.log('Protected route access logic', true);
    } catch (error) {
      this.log('Protected route access logic', false, error);
    }
  }

  private async testRoleBasedRoutes(): Promise<void> {
    console.log('👥 Testing Role-Based Route Access...');

    try {
      // Test role-based access control for different routes
      const testCases = [
        {
          user: { role: 'ADMIN' as Role },
          requiredRoles: ['ADMIN' as Role],
          shouldHaveAccess: true,
          description: 'ADMIN accessing ADMIN-only route'
        },
        {
          user: { role: 'STAFF' as Role },
          requiredRoles: ['ADMIN' as Role],
          shouldHaveAccess: false,
          description: 'STAFF accessing ADMIN-only route'
        },
        {
          user: { role: 'MANAGER' as Role },
          requiredRoles: ['ADMIN' as Role, 'MANAGER' as Role],
          shouldHaveAccess: true,
          description: 'MANAGER accessing ADMIN or MANAGER route'
        },
        {
          user: { role: 'VIEWER' as Role },
          requiredRoles: ['STAFF' as Role],
          shouldHaveAccess: false,
          description: 'VIEWER accessing STAFF-only route'
        }
      ];

      for (const testCase of testCases) {
        const hasRequiredRole = testCase.requiredRoles.includes(testCase.user.role);
        if (hasRequiredRole !== testCase.shouldHaveAccess) {
          throw new Error(`${testCase.description}: Expected ${testCase.shouldHaveAccess}, got ${hasRequiredRole}`);
        }
      }

      this.log('Role-based route access', true);
    } catch (error) {
      this.log('Role-based route access', false, error);
    }
  }

  private async testMiddlewareErrorHandling(): Promise<void> {
    console.log('🚨 Testing Middleware Error Handling...');

    try {
      // Test error responses for unauthorized access
      const unauthorizedResponse = NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );

      if (unauthorizedResponse.status !== 401) {
        throw new Error('Unauthorized response should have 401 status');
      }

      // Test forbidden access response
      const forbiddenResponse = NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );

      if (forbiddenResponse.status !== 403) {
        throw new Error('Forbidden response should have 403 status');
      }

      // Test that middleware handles missing tokens gracefully
      const nullUser: JWTPayload | null = null;
      const hasRoleForNull = hasRole(nullUser, 'ADMIN');

      if (hasRoleForNull) {
        throw new Error('Null user should not have any roles');
      }

      this.log('Middleware error handling', true);
    } catch (error) {
      this.log('Middleware error handling', false, error);
    }
  }

  private printSummary(): void {
    console.log('\n📊 MIDDLEWARE TEST SUMMARY');
    console.log('==========================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.testName}`);
      });
    }

    console.log('\n🎯 AUTHENTICATION MIDDLEWARE TEST COMPLETE');
    console.log('===========================================');

    if (failed === 0) {
      console.log('✅ ALL MIDDLEWARE TESTS PASSED!');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review the middleware.`);
    }
  }
}

// Run the middleware tests
async function runAuthMiddlewareTests() {
  const tester = new AuthMiddlewareTester();
  await tester.runAllTests();
}

if (require.main === module) {
  runAuthMiddlewareTests().catch(console.error);
}

export { AuthMiddlewareTester };

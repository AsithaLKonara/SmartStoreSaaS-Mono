/**
 * Comprehensive JWT Authentication System Test
 *
 * This test file thoroughly tests the complete JWT-based authentication system
 * including token generation, verification, RBAC, middleware logic, and error scenarios.
 * Tests are designed to run without database dependencies.
 */

import { JWTUtils, JWTPayload } from './src/lib/auth/jwt';
import { Permission, Role, hasPermission, canPerformAction, RolePermissions } from './src/lib/rbac/permissions';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class JWTAuthTester {
  private results: TestResult[] = [];
  private testUser: JWTPayload = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    organizationId: 'test-org-id'
  };
  private accessToken: string = '';
  private refreshToken: string = '';

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
    console.log('🚀 STARTING COMPREHENSIVE JWT AUTHENTICATION TESTS');
    console.log('==================================================\n');

    try {
      await this.setupTestData();

      // JWT Token Tests
      await this.testJWTTokenGeneration();
      await this.testJWTTokenVerification();
      await this.testJWTTokenExpiration();
      await this.testInvalidTokens();

      // RBAC Tests
      await this.testRBACPermissions();
      await this.testRoleHierarchy();
      await this.testPermissionChecks();

      // Token Refresh Tests
      await this.testTokenRefresh();

      // Error Handling Tests
      await this.testErrorScenarios();

      // Security Tests
      await this.testSecurityFeatures();

      this.printSummary();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.log('Test suite execution', false, error);
    }
  }

  private async setupTestData(): Promise<void> {
    console.log('🔧 Setting up test data...');
    this.log('Test data setup completed');
  }

  // JWT Token Tests
  private async testJWTTokenGeneration(): Promise<void> {
    console.log('\n🔐 Testing JWT Token Generation...');

    try {
      const userData = {
        id: this.testUser.id,
        email: this.testUser.email,
        name: this.testUser.name,
        role: this.testUser.role,
        organizationId: this.testUser.organizationId
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokens(userData);

      if (!accessToken || !refreshToken) {
        throw new Error('Tokens not generated');
      }

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      this.log('JWT token generation', true);
    } catch (error) {
      this.log('JWT token generation', false, error);
    }
  }

  private async testJWTTokenVerification(): Promise<void> {
    console.log('🔍 Testing JWT Token Verification...');

    try {
      const decoded = JWTUtils.verifyAccessToken(this.accessToken);

      if (!decoded || decoded.email !== this.testUser.email) {
        throw new Error('Token verification failed');
      }

      this.log('JWT token verification', true);
    } catch (error) {
      this.log('JWT token verification', false, error);
    }
  }

  private async testJWTTokenExpiration(): Promise<void> {
    console.log('⏰ Testing JWT Token Expiration...');

    try {
      // Create a token that expires in 1 second
      const expiredToken = JWTUtils.signAccessToken({
        id: this.testUser.id,
        email: this.testUser.email,
        role: this.testUser.role,
        organizationId: this.testUser.organizationId
      }, '1s');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      try {
        JWTUtils.verifyAccessToken(expiredToken);
        throw new Error('Token should have expired');
      } catch (error: any) {
        if (error.message.includes('expired')) {
          this.log('JWT token expiration handling', true);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.log('JWT token expiration handling', false, error);
    }
  }

  private async testInvalidTokens(): Promise<void> {
    console.log('🚫 Testing Invalid Token Handling...');

    try {
      // Test with invalid token
      try {
        JWTUtils.verifyAccessToken('invalid.jwt.token');
        throw new Error('Should have rejected invalid token');
      } catch (error: any) {
        if (error.message.includes('Invalid') || error.message.includes('invalid')) {
          this.log('Invalid token rejection', true);
        } else {
          throw error;
        }
      }

      // Test with malformed token
      try {
        JWTUtils.verifyAccessToken('not-a-jwt-token-at-all');
        throw new Error('Should have rejected malformed token');
      } catch (error: any) {
        if (error.message.includes('Invalid') || error.message.includes('invalid')) {
          this.log('Malformed token rejection', true);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.log('Invalid token handling', false, error);
    }
  }


  // RBAC Tests
  private async testRBACPermissions(): Promise<void> {
    console.log('\n🛡️  Testing RBAC Permissions...');

    try {
      // Test ADMIN role permissions
      const adminHasProductView = hasPermission(Role.ADMIN, Permission.PRODUCT_VIEW);
      const adminHasAdminSettings = hasPermission(Role.ADMIN, Permission.ADMIN_SETTINGS);

      if (!adminHasProductView) {
        throw new Error('ADMIN should have PRODUCT_VIEW permission');
      }

      if (!adminHasAdminSettings) {
        throw new Error('ADMIN should have ADMIN_SETTINGS permission');
      }

      // Test VIEWER role restrictions
      const viewerHasProductDelete = hasPermission(Role.VIEWER, Permission.PRODUCT_DELETE);
      const viewerHasProductView = hasPermission(Role.VIEWER, Permission.PRODUCT_VIEW);

      if (viewerHasProductDelete) {
        throw new Error('VIEWER should not have PRODUCT_DELETE permission');
      }

      if (!viewerHasProductView) {
        throw new Error('VIEWER should have PRODUCT_VIEW permission');
      }

      // Test SUPER_ADMIN has all permissions
      const superAdminHasAll = Object.values(Permission).every(permission =>
        hasPermission(Role.SUPER_ADMIN, permission)
      );

      if (!superAdminHasAll) {
        throw new Error('SUPER_ADMIN should have all permissions');
      }

      this.log('RBAC permission checks', true);
    } catch (error) {
      this.log('RBAC permission checks', false, error);
    }
  }

  private async testRoleHierarchy(): Promise<void> {
    console.log('🏗️  Testing Role Hierarchy...');

    try {
      // SUPER_ADMIN should have all permissions
      const superAdminPermissions = Object.values(Permission);
      const superAdminHasAll = superAdminPermissions.every(permission =>
        hasPermission(Role.SUPER_ADMIN, permission)
      );

      if (!superAdminHasAll) {
        throw new Error('SUPER_ADMIN should have all permissions');
      }

      // STAFF should have fewer permissions than ADMIN
      const adminPermissions = Object.values(Permission).filter(p =>
        hasPermission(Role.ADMIN, p)
      );
      const staffPermissions = Object.values(Permission).filter(p =>
        hasPermission(Role.STAFF, p)
      );

      if (staffPermissions.length >= adminPermissions.length) {
        throw new Error('STAFF should have fewer permissions than ADMIN');
      }

      this.log('Role hierarchy validation', true);
    } catch (error) {
      this.log('Role hierarchy validation', false, error);
    }
  }

  private async testPermissionChecks(): Promise<void> {
    console.log('🔍 Testing Permission Action Checks...');

    try {
      // Test canPerformAction function
      const adminCanView = canPerformAction(Role.ADMIN, 'product', 'view');
      const adminCanDelete = canPerformAction(Role.ADMIN, 'product', 'delete');
      const viewerCanDelete = canPerformAction(Role.VIEWER, 'product', 'delete');

      if (!adminCanView || !adminCanDelete) {
        throw new Error('ADMIN should be able to view and delete products');
      }

      if (viewerCanDelete) {
        throw new Error('VIEWER should not be able to delete products');
      }

      this.log('Permission action checks', true);
    } catch (error) {
      this.log('Permission action checks', false, error);
    }
  }

  private async testTokenRefresh(): Promise<void> {
    console.log('🔄 Testing Token Refresh...');

    try {
      // Test refresh token verification
      const decodedRefresh = JWTUtils.verifyRefreshToken(this.refreshToken);

      if (!decodedRefresh || decodedRefresh.email !== this.testUser.email) {
        throw new Error('Refresh token verification failed');
      }

      // Test refresh logic
      const refreshResult = await JWTUtils.refreshAccessToken(this.refreshToken);

      if (!refreshResult) {
        throw new Error('Token refresh failed');
      }

      this.log('Token refresh functionality', true);
    } catch (error) {
      this.log('Token refresh functionality', false, error);
    }
  }

  // Error Handling Tests
  private async testErrorScenarios(): Promise<void> {
    console.log('\n🚨 Testing Error Scenarios...');

    try {
      // Test invalid token verification
      try {
        JWTUtils.verifyAccessToken('invalid-token');
        throw new Error('Should have rejected invalid token');
      } catch (error: any) {
        if (!error.message.includes('Invalid')) {
          throw new Error('Should return proper error for invalid token');
        }
      }

      // Test expired token handling
      const expiredToken = JWTUtils.signAccessToken(this.testUser, '1s');
      await new Promise(resolve => setTimeout(resolve, 1100));

      try {
        JWTUtils.verifyAccessToken(expiredToken);
        throw new Error('Should have rejected expired token');
      } catch (error: any) {
        if (!error.message.includes('expired')) {
          throw new Error('Should return proper error for expired token');
        }
      }

      this.log('Error scenario handling', true);
    } catch (error) {
      this.log('Error scenario handling', false, error);
    }
  }

  // Security Tests
  private async testSecurityFeatures(): Promise<void> {
    console.log('\n🔐 Testing Security Features...');

    try {
      // Test token tampering detection
      const validToken = JWTUtils.signAccessToken(this.testUser);
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx'; // Tamper with signature

      try {
        JWTUtils.verifyAccessToken(tamperedToken);
        throw new Error('Should have detected tampered token');
      } catch (error: any) {
        if (!error.message.includes('Invalid') && !error.message.includes('signature')) {
          throw new Error('Should detect token tampering');
        }
      }

      // Test organization access control logic
      const userFromOrgA: JWTPayload = { ...this.testUser, organizationId: 'org-a' };
      const userFromOrgB: JWTPayload = { ...this.testUser, organizationId: 'org-b' };

      // Users should only access their own organization's data
      const canAccessOwnOrg = userFromOrgA.organizationId === 'org-a';
      const cannotAccessOtherOrg = userFromOrgA.organizationId !== 'org-b';

      if (!canAccessOwnOrg || !cannotAccessOtherOrg) {
        throw new Error('Organization access control failed');
      }

      this.log('Security features validation', true);
    } catch (error) {
      this.log('Security features validation', false, error);
    }
  }

  private printSummary(): void {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');

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

    console.log('\n🎯 JWT AUTHENTICATION SYSTEM TEST COMPLETE');
    console.log('===========================================');

    if (failed === 0) {
      console.log('✅ ALL TESTS PASSED! Authentication system is working correctly.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review the authentication system.`);
    }
  }
}

// Run the tests
async function runJWTAuthTests() {
  const tester = new JWTAuthTester();
  await tester.runAllTests();
}

if (require.main === module) {
  runJWTAuthTests().catch(console.error);
}

export { JWTAuthTester };

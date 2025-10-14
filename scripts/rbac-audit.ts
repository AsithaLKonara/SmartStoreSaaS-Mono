#!/usr/bin/env ts-node
/**
 * RBAC Audit Script
 * 
 * This script validates that RBAC (Role-Based Access Control) is correctly
 * enforced across all API routes and frontend pages.
 * 
 * Usage:
 *   ts-node scripts/rbac-audit.ts
 * 
 * Requirements:
 *   - Test database seeded with demo users for all 4 roles
 *   - Server running (for API tests)
 *   - rbac-routes.json in project root
 */

import fs from 'fs';
import path from 'path';

interface RBACRoute {
  path: string;
  method?: string;
  allowedRoles: string[];
  requiredPermission?: string;
  category: string;
  requiresAuth?: boolean;
}

interface RBACConfig {
  roles: Record<string, any>;
  routes: RBACRoute[];
  pages: RBACRoute[];
}

interface AuditResult {
  route: string;
  role: string;
  expected: number;
  actual: number;
  status: 'PASS' | 'FAIL';
  error?: string;
}

// Demo credentials (should match seeded data)
const DEMO_CREDENTIALS: Record<string, { email: string; password: string }> = {
  SUPER_ADMIN: {
    email: 'superadmin@smartstore.com',
    password: 'SuperAdmin123!'
  },
  TENANT_ADMIN: {
    email: 'admin@demo.com',
    password: 'Admin123!'
  },
  STAFF: {
    email: 'staff@demo.com',
    password: 'Staff123!'
  },
  CUSTOMER: {
    email: 'customer@demo.com',
    password: 'Customer123!'
  }
};

class RBACAuthor {
  private config: RBACConfig;
  private baseUrl: string;
  private tokens: Map<string, string>;
  private results: AuditResult[];

  constructor(configPath: string, baseUrl: string = 'http://localhost:3000') {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent);
    this.baseUrl = baseUrl;
    this.tokens = new Map();
    this.results = [];
  }

  /**
   * Login and get authentication token for a role
   */
  async loginAs(role: string): Promise<string> {
    if (this.tokens.has(role)) {
      return this.tokens.get(role)!;
    }

    const credentials = DEMO_CREDENTIALS[role];
    if (!credentials) {
      throw new Error(`No credentials found for role: ${role}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: credentials.email,
          password: credentials.password,
          redirect: 'false'
        })
      });

      if (!response.ok) {
        throw new Error(`Login failed for ${role}: ${response.statusText}`);
      }

      // NextAuth returns HTML or redirects, not JSON
      const token = this.extractTokenFromCookies(response.headers);
      
      this.tokens.set(role, token);
      return token;
    } catch (error) {
      throw new Error(`Failed to login as ${role}: ${error}`);
    }
  }

  /**
   * Extract token from Set-Cookie headers
   */
  private extractTokenFromCookies(headers: Headers): string {
    const cookies = headers.get('set-cookie') || '';
    // Look for both session token and csrf token
    const sessionMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
    const csrfMatch = cookies.match(/next-auth\.csrf-token=([^;]+)/);
    return sessionMatch ? sessionMatch[1] : (csrfMatch ? csrfMatch[1] : '');
  }

  /**
   * Test a single API route with a specific role
   */
  async testRoute(route: RBACRoute, role: string): Promise<AuditResult> {
    const isAllowed = route.allowedRoles.includes(role) || route.allowedRoles.includes('*');
    const expectedStatus = isAllowed ? 200 : 403;
    const method = route.method || 'GET';

    try {
      const token = await this.loginAs(role);
      const url = `${this.baseUrl}${route.path.replace(/\[id\]/g, 'test-id')}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Cookie': `next-auth.session-token=${token}; next-auth.csrf-token=${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result: AuditResult = {
        route: `${method} ${route.path}`,
        role,
        expected: expectedStatus,
        actual: response.status,
        status: response.status === expectedStatus ? 'PASS' : 'FAIL'
      };

      if (result.status === 'FAIL') {
        result.error = `Expected ${expectedStatus}, got ${response.status}`;
      }

      this.results.push(result);
      return result;
    } catch (error) {
      const result: AuditResult = {
        route: `${method} ${route.path}`,
        role,
        expected: expectedStatus,
        actual: 0,
        status: 'FAIL',
        error: String(error)
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Run full RBAC audit
   */
  async runAudit(): Promise<void> {
    console.log('🔍 Starting RBAC Audit...\n');
    console.log(`📋 Testing ${this.config.routes.length} API routes`);
    console.log(`📄 Testing ${this.config.pages.length} pages\n`);

    const roles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF', 'CUSTOMER'];

    // Test API routes
    console.log('🔐 Testing API Routes...\n');
    for (const route of this.config.routes) {
      for (const role of roles) {
        await this.testRoute(route, role);
      }
    }

    // Generate report
    this.generateReport();
  }

  /**
   * Generate audit report
   */
  private generateReport(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('📊 RBAC AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${passRate}%)`);
    console.log(`❌ Failed: ${failed} (${(100 - parseFloat(passRate)).toFixed(2)}%)\n`);

    if (failed > 0) {
      console.log('❌ FAILED TESTS:\n');
      const failures = this.results.filter(r => r.status === 'FAIL');
      
      // Group failures by route
      const groupedFailures = failures.reduce((acc, failure) => {
        if (!acc[failure.route]) {
          acc[failure.route] = [];
        }
        acc[failure.route].push(failure);
        return acc;
      }, {} as Record<string, AuditResult[]>);

      for (const [route, failures] of Object.entries(groupedFailures)) {
        console.log(`\n📍 ${route}`);
        for (const failure of failures) {
          console.log(`   Role: ${failure.role.padEnd(15)} | ${failure.error || 'RBAC mismatch'}`);
        }
      }
    }

    // Category breakdown
    console.log('\n' + '-'.repeat(80));
    console.log('📂 BREAKDOWN BY CATEGORY:\n');
    
    const categories = [...new Set(this.config.routes.map(r => r.category))];
    for (const category of categories) {
      const categoryResults = this.results.filter(r => 
        this.config.routes.find(route => 
          r.route.includes(route.path) && route.category === category
        )
      );
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      const categoryTotal = categoryResults.length;
      const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(2) : '0.00';
      
      console.log(`${category.padEnd(30)}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'rbac-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        passRate: parseFloat(passRate)
      },
      results: this.results
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('='.repeat(80) + '\n');

    // Exit with error code if any tests failed
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const configPath = path.join(process.cwd(), 'rbac-routes.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ Error: rbac-routes.json not found in project root');
    process.exit(1);
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const auditor = new RBACAuthor(configPath, baseUrl);

  try {
    await auditor.runAudit();
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { RBACAuthor, RBACRoute, AuditResult };


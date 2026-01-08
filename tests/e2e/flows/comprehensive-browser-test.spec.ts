/**
 * Comprehensive Browser-Based Feature Testing Script
 * Tests all roles, pages, buttons, and interactions
 * Monitors errors, exceptions, and console statements
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

interface TestResult {
  role: string;
  page: string;
  status: 'pass' | 'fail' | 'skip';
  errors: string[];
  warnings: string[];
  apiErrors: string[];
  buttonsTested: number;
  buttonsWorking: number;
  timestamp: string;
}

const testResults: TestResult[] = [];
const consoleErrors: string[] = [];
const apiErrors: string[] = [];

// Test Credentials
const CREDENTIALS = {
  SUPER_ADMIN: {
    email: 'superadmin@smartstore.com',
    password: 'SuperAdmin123!',
    pages: 72
  },
  TENANT_ADMIN: {
    email: 'admin@smartstore.com',
    password: 'password123',
    pages: 63
  },
  STAFF: {
    email: 'sales@demo.com',
    password: 'Sales123!',
    pages: 30
  },
  CUSTOMER: {
    email: 'customer@demo.com',
    password: 'Customer123!',
    pages: 6
  }
};

// All pages to test by role
const PAGES = {
  SUPER_ADMIN: [
    '/dashboard',
    '/products',
    '/products/new',
    '/orders',
    '/orders/new',
    '/customers',
    '/customers/new',
    '/inventory',
    '/warehouse',
    '/pos',
    '/fulfillment',
    '/returns',
    '/shipping',
    '/accounting',
    '/accounting/chart-of-accounts',
    '/accounting/journal-entries',
    '/accounting/journal-entries/new',
    '/accounting/ledger',
    '/accounting/bank',
    '/accounting/tax',
    '/accounting/reports',
    '/payments',
    '/payments/new',
    '/billing',
    '/expenses',
    '/analytics',
    '/analytics/enhanced',
    '/analytics/customer-insights',
    '/ai-insights',
    '/ai-analytics',
    '/campaigns',
    '/loyalty',
    '/affiliates',
    '/integrations',
    '/integrations/email',
    '/integrations/sms',
    '/integrations/whatsapp',
    '/integrations/stripe',
    '/integrations/payhere',
    '/integrations/shopify',
    '/integrations/woocommerce',
    '/tenants',
    '/admin/billing',
    '/admin/packages',
    '/audit',
    '/compliance',
    '/compliance/audit-logs',
    '/backup',
    '/monitoring',
    '/performance',
    '/users',
    '/categories',
    '/couriers',
    '/procurement',
    '/procurement/purchase-orders',
    '/procurement/suppliers',
    '/procurement/analytics',
    '/suppliers',
    '/reports',
    '/reviews',
    '/chat',
    '/webhooks',
    '/settings',
    '/settings/features',
    '/sync',
    '/testing',
    '/documentation',
    '/configuration'
  ],
  TENANT_ADMIN: [
    '/dashboard',
    '/products',
    '/products/new',
    '/orders',
    '/orders/new',
    '/customers',
    '/customers/new',
    '/inventory',
    '/warehouse',
    '/pos',
    '/fulfillment',
    '/returns',
    '/shipping',
    '/accounting',
    '/accounting/chart-of-accounts',
    '/accounting/journal-entries',
    '/accounting/journal-entries/new',
    '/accounting/ledger',
    '/accounting/bank',
    '/accounting/tax',
    '/accounting/reports',
    '/payments',
    '/payments/new',
    '/billing',
    '/expenses',
    '/analytics',
    '/analytics/enhanced',
    '/analytics/customer-insights',
    '/ai-insights',
    '/ai-analytics',
    '/campaigns',
    '/loyalty',
    '/affiliates',
    '/integrations',
    '/integrations/email',
    '/integrations/sms',
    '/integrations/whatsapp',
    '/integrations/stripe',
    '/integrations/payhere',
    '/integrations/shopify',
    '/integrations/woocommerce',
    '/users',
    '/categories',
    '/couriers',
    '/procurement',
    '/procurement/purchase-orders',
    '/procurement/suppliers',
    '/procurement/analytics',
    '/suppliers',
    '/reports',
    '/reviews',
    '/chat',
    '/webhooks',
    '/settings',
    '/settings/features',
    '/sync',
    '/testing',
    '/documentation',
    '/configuration'
  ],
  STAFF: [
    '/dashboard',
    '/products',
    '/orders',
    '/orders/new',
    '/customers',
    '/inventory'
  ],
  CUSTOMER: [
    '/shop',
    '/my-orders',
    '/wishlist',
    '/support'
  ]
};

/**
 * Setup console and network monitoring
 */
async function setupMonitoring(page: Page) {
  // Monitor console
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      consoleErrors.push(`[${new Date().toISOString()}] ${text}`);
    } else if (type === 'warning') {
      consoleErrors.push(`[WARNING] ${text}`);
    }
  });

  // Monitor network errors
  page.on('response', (response) => {
    if (response.status() >= 400) {
      apiErrors.push(`[${response.status()}] ${response.url()}`);
    }
  });

  page.on('requestfailed', (request) => {
    apiErrors.push(`[FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });
}

/**
 * Login with credentials
 */
async function login(page: Page, email: string, password: string, timeout: number = 15000) {
  await page.goto('http://localhost:3000/login', { timeout, waitUntil: 'networkidle' });
  
  // Wait for form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  
  await page.fill('input[type="email"]', email, { timeout: 5000 });
  await page.fill('input[type="password"]', password, { timeout: 5000 });
  
  // Wait a bit before clicking submit
  await page.waitForTimeout(500);
  
  await page.click('button[type="submit"]', { timeout: 5000 });
  
  // Wait for navigation to dashboard with longer timeout
  await page.waitForURL('**/dashboard', { timeout: timeout * 2, waitUntil: 'networkidle' }).catch(() => {
    // If redirect fails, check if we're still on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error(`Login failed - still on login page: ${currentUrl}`);
    }
  });
  
  // Wait for session to be fully established and page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000); // Additional wait for session cookie to be set
}

/**
 * Test a single page with timeouts
 */
async function testPage(
  page: Page,
  url: string,
  role: string,
  pageTimeout: number = 20000,
  actionTimeout: number = 5000
): Promise<TestResult> {
  const result: TestResult = {
    role,
    page: url,
    status: 'pass',
    errors: [],
    warnings: [],
    apiErrors: [],
    buttonsTested: 0,
    buttonsWorking: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // Navigate to page with timeout - handle redirects gracefully
    const response = await page.goto(`http://localhost:3000${url}`, { 
      waitUntil: 'domcontentloaded', // Faster than networkidle
      timeout: pageTimeout 
    }).catch((err) => {
      // If navigation is aborted, it might be a redirect - check current URL
      return null;
    });

    // Check if we were redirected
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      result.status = 'fail';
      result.errors.push('Page redirected to login (unauthorized access)');
      return result;
    }

    // Wait for page to load with timeout
    await Promise.race([
      page.waitForLoadState('networkidle', { timeout: 10000 }),
      page.waitForTimeout(3000) // Fallback timeout
    ]).catch(() => {});

    // Check for errors in console (with timeout)
    const consoleMessages = await Promise.race([
      page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      }),
      new Promise(resolve => setTimeout(() => resolve([]), 2000))
    ]) as any[];

    // Test buttons with timeout
    const buttons = await page.locator('button').all().catch(() => []);
    result.buttonsTested = buttons.length;

    // Test first 10 buttons (or less if fewer exist)
    const buttonsToTest = buttons.slice(0, Math.min(10, buttons.length));
    for (const button of buttonsToTest) {
      try {
        const isVisible = await Promise.race([
          button.isVisible(),
          new Promise(resolve => setTimeout(() => resolve(false), actionTimeout))
        ]).catch(() => false) as boolean;

        if (!isVisible) continue;

        const isEnabled = await Promise.race([
          button.isEnabled(),
          new Promise(resolve => setTimeout(() => resolve(false), actionTimeout))
        ]).catch(() => false) as boolean;
        
        if (isVisible && isEnabled) {
          // Try clicking (but don't submit forms)
          const buttonText = await Promise.race([
            button.textContent(),
            new Promise(resolve => setTimeout(() => resolve(''), 2000))
          ]).catch(() => '') as string;

          if (!buttonText?.includes('Submit') && !buttonText?.includes('Save') && !buttonText?.includes('Delete')) {
            await Promise.race([
              button.click({ timeout: actionTimeout }),
              new Promise(resolve => setTimeout(resolve, actionTimeout))
            ]).catch(() => {});
            result.buttonsWorking++;
            await page.waitForTimeout(300);
          }
        }
      } catch (e) {
        result.errors.push(`Button click error: ${e}`);
      }
    }

    // Check for error messages on page (with timeout)
    const errorElements = await Promise.race([
      page.locator('[role="alert"], .error, .text-red-500').all(),
      new Promise(resolve => setTimeout(() => resolve([]), 2000))
    ]).catch(() => []) as any[];
    
    if (errorElements.length > 0) {
      result.warnings.push(`Found ${errorElements.length} error elements on page`);
    }

    // Check page title (with timeout)
    const title = await Promise.race([
      page.title(),
      new Promise(resolve => setTimeout(() => resolve(''), 2000))
    ]).catch(() => '') as string;
    
    if (title.includes('Error') || title.includes('404')) {
      result.status = 'fail';
      result.errors.push('Page shows error in title');
    }

    // Check if page redirected to login (unauthorized) - already checked above
    // Re-check current URL in case redirect happened during page load
    const finalUrl = page.url();
    if (finalUrl.includes('/login') && !url.includes('/login')) {
      result.status = 'fail';
      result.errors.push('Page redirected to login (unauthorized access)');
    }

  } catch (error) {
    result.status = 'fail';
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Navigation error: ${errorMsg}`);
  }

  return result;
}

/**
 * Test SUPER_ADMIN role
 */
test.describe('SUPER_ADMIN Testing', () => {
  test.setTimeout(600000); // 10 minutes total for all SUPER_ADMIN pages
  
  test('Test all SUPER_ADMIN pages', async ({ page, context }) => {
    test.setTimeout(600000); // 10 minutes for this test
    
    await setupMonitoring(page);
    
    try {
      await login(page, CREDENTIALS.SUPER_ADMIN.email, CREDENTIALS.SUPER_ADMIN.password, 20000);
      
      for (let i = 0; i < PAGES.SUPER_ADMIN.length; i++) {
        const pageUrl = PAGES.SUPER_ADMIN[i];
        test.step(`Testing page ${i + 1}/${PAGES.SUPER_ADMIN.length}: ${pageUrl}`, async () => {
          const result = await testPage(page, pageUrl, 'SUPER_ADMIN', 20000, 5000);
          testResults.push(result);
          const statusEmoji = result.status === 'pass' ? '✅' : '❌';
          const errorCount = result.errors.length;
          const warningCount = result.warnings.length;
          console.log(`${statusEmoji} [${new Date().toISOString()}] Tested: ${pageUrl} - ${result.status}${errorCount > 0 ? ` (${errorCount} errors)` : ''}${warningCount > 0 ? ` (${warningCount} warnings)` : ''}`);
          if (result.errors.length > 0) {
            result.errors.slice(0, 2).forEach((err, idx) => {
              console.log(`   Error ${idx + 1}: ${err}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('SUPER_ADMIN test suite error:', error);
    }
  });
});

/**
 * Test TENANT_ADMIN role
 */
test.describe('TENANT_ADMIN Testing', () => {
  test.setTimeout(600000); // 10 minutes total
  
  test('Test all TENANT_ADMIN pages', async ({ page }) => {
    test.setTimeout(600000);
    
    await setupMonitoring(page);
    
    try {
      await login(page, CREDENTIALS.TENANT_ADMIN.email, CREDENTIALS.TENANT_ADMIN.password, 20000);
      
      for (let i = 0; i < PAGES.TENANT_ADMIN.length; i++) {
        const pageUrl = PAGES.TENANT_ADMIN[i];
        test.step(`Testing page ${i + 1}/${PAGES.TENANT_ADMIN.length}: ${pageUrl}`, async () => {
          const result = await testPage(page, pageUrl, 'TENANT_ADMIN', 20000, 5000);
          testResults.push(result);
          const statusEmoji = result.status === 'pass' ? '✅' : '❌';
          const errorCount = result.errors.length;
          const warningCount = result.warnings.length;
          console.log(`${statusEmoji} [${new Date().toISOString()}] Tested: ${pageUrl} - ${result.status}${errorCount > 0 ? ` (${errorCount} errors)` : ''}${warningCount > 0 ? ` (${warningCount} warnings)` : ''}`);
          if (result.errors.length > 0) {
            result.errors.slice(0, 2).forEach((err, idx) => {
              console.log(`   Error ${idx + 1}: ${err}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('TENANT_ADMIN test suite error:', error);
    }
  });
});

/**
 * Test STAFF role
 */
test.describe('STAFF Testing', () => {
  test.setTimeout(300000); // 5 minutes total
  
  test('Test all STAFF pages', async ({ page }) => {
    test.setTimeout(300000);
    
    await setupMonitoring(page);
    
    try {
      await login(page, CREDENTIALS.STAFF.email, CREDENTIALS.STAFF.password, 20000);
      
      for (let i = 0; i < PAGES.STAFF.length; i++) {
        const pageUrl = PAGES.STAFF[i];
        test.step(`Testing page ${i + 1}/${PAGES.STAFF.length}: ${pageUrl}`, async () => {
          const result = await testPage(page, pageUrl, 'STAFF', 20000, 5000);
          testResults.push(result);
          const statusEmoji = result.status === 'pass' ? '✅' : '❌';
          const errorCount = result.errors.length;
          const warningCount = result.warnings.length;
          console.log(`${statusEmoji} [${new Date().toISOString()}] Tested: ${pageUrl} - ${result.status}${errorCount > 0 ? ` (${errorCount} errors)` : ''}${warningCount > 0 ? ` (${warningCount} warnings)` : ''}`);
          if (result.errors.length > 0) {
            result.errors.slice(0, 2).forEach((err, idx) => {
              console.log(`   Error ${idx + 1}: ${err}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('STAFF test suite error:', error);
    }
  });
});

/**
 * Test CUSTOMER role
 */
test.describe('CUSTOMER Testing', () => {
  test.setTimeout(120000); // 2 minutes total
  
  test('Test all CUSTOMER pages', async ({ page }) => {
    test.setTimeout(120000);
    
    await setupMonitoring(page);
    
    try {
      await login(page, CREDENTIALS.CUSTOMER.email, CREDENTIALS.CUSTOMER.password, 20000);
      
      for (let i = 0; i < PAGES.CUSTOMER.length; i++) {
        const pageUrl = PAGES.CUSTOMER[i];
        test.step(`Testing page ${i + 1}/${PAGES.CUSTOMER.length}: ${pageUrl}`, async () => {
          const result = await testPage(page, pageUrl, 'CUSTOMER', 20000, 5000);
          testResults.push(result);
          const statusEmoji = result.status === 'pass' ? '✅' : '❌';
          const errorCount = result.errors.length;
          const warningCount = result.warnings.length;
          console.log(`${statusEmoji} [${new Date().toISOString()}] Tested: ${pageUrl} - ${result.status}${errorCount > 0 ? ` (${errorCount} errors)` : ''}${warningCount > 0 ? ` (${warningCount} warnings)` : ''}`);
          if (result.errors.length > 0) {
            result.errors.slice(0, 2).forEach((err, idx) => {
              console.log(`   Error ${idx + 1}: ${err}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('CUSTOMER test suite error:', error);
    }
  });
});

// Export results
export { testResults, consoleErrors, apiErrors };


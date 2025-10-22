import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Tests - ALL Dashboard Pages
 * Tests every single page for runtime errors
 */

const BASE_URL = process.env.E2E_BASE_URL || 'https://smart-store-saas-demo.vercel.app';

const DASHBOARD_PAGES = [
  { path: '/dashboard', name: 'Dashboard Home' },
  { path: '/dashboard/products', name: 'Products' },
  { path: '/dashboard/products/new', name: 'New Product' },
  { path: '/dashboard/orders', name: 'Orders' },
  { path: '/dashboard/customers', name: 'Customers' },
  { path: '/dashboard/customers/new', name: 'New Customer' },
  { path: '/dashboard/inventory', name: 'Inventory' },
  { path: '/dashboard/inventory/transfer', name: 'Inventory Transfer' },
  { path: '/dashboard/pos', name: 'POS' },
  { path: '/dashboard/analytics', name: 'Analytics' },
  { path: '/dashboard/reports', name: 'Reports' },
  { path: '/dashboard/marketing', name: 'Marketing' },
  { path: '/dashboard/marketing/campaigns', name: 'Marketing Campaigns' },
  { path: '/dashboard/marketing/abandoned-carts', name: 'Abandoned Carts' },
  { path: '/dashboard/marketing/referrals', name: 'Referrals' },
  { path: '/dashboard/support', name: 'Support' },
  { path: '/dashboard/support/tickets', name: 'Support Tickets' },
  { path: '/dashboard/integrations', name: 'Integrations' },
  { path: '/dashboard/integrations/woocommerce', name: 'WooCommerce Integration' },
  { path: '/dashboard/integrations/whatsapp', name: 'WhatsApp Integration' },
  { path: '/dashboard/affiliates', name: 'Affiliates' },
  { path: '/dashboard/returns', name: 'Returns' },
  { path: '/dashboard/reviews', name: 'Reviews' },
  { path: '/dashboard/subscriptions', name: 'Subscriptions' },
  { path: '/dashboard/fulfillment', name: 'Fulfillment' },
  { path: '/dashboard/couriers', name: 'Couriers' },
  { path: '/dashboard/compliance', name: 'Compliance' },
  { path: '/dashboard/compliance/gdpr', name: 'GDPR' },
  { path: '/dashboard/settings', name: 'Settings' },
  { path: '/dashboard/settings/profile', name: 'Profile Settings' },
  { path: '/dashboard/settings/organization', name: 'Organization Settings' },
  { path: '/dashboard/settings/users', name: 'User Management' },
  { path: '/dashboard/settings/billing', name: 'Billing' },
  { path: '/dashboard/settings/security', name: 'Security' },
  { path: '/dashboard/settings/notifications', name: 'Notifications' },
  { path: '/dashboard/settings/integrations', name: 'Integration Settings' },
  { path: '/dashboard/settings/ai', name: 'AI Settings' }
];

test.describe('Comprehensive Page Tests', () => {
  test.setTimeout(30000); // 30 seconds per test

  for (const page of DASHBOARD_PAGES) {
    test(`${page.name} - Check for runtime errors`, async ({ page: playwright }) => {
      console.log(`🧪 Testing: ${page.name} (${page.path})`);
      
      // Track console errors
      const consoleErrors: string[] = [];
      playwright.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Track page errors
      const pageErrors: Error[] = [];
      playwright.on('pageerror', error => {
        pageErrors.push(error);
      });

      // Visit page
      await playwright.goto(`${BASE_URL}${page.path}`);
      await playwright.waitForLoadState('networkidle');
      await playwright.waitForTimeout(2000); // Wait for any delayed renders

      // Check for "Something went wrong"
      const errorText = await playwright.locator('text=/something went wrong|error occurred|failed to load/i').count();
      
      // Check for React error boundaries
      const errorBoundary = await playwright.locator('[data-error-boundary], .error-boundary').count();

      // Take screenshot
      await playwright.screenshot({ 
        path: `test-results/pages/${page.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      });

      // Assertions
      expect(errorText).toBe(0);
      expect(errorBoundary).toBe(0);
      expect(pageErrors.length).toBe(0);
      
      // Log results
      if (consoleErrors.length > 0) {
        console.log(`⚠️ Console errors found: ${consoleErrors.length}`);
        consoleErrors.forEach(err => console.log(`  - ${err}`));
      } else {
        console.log(`✅ ${page.name} - No errors`);
      }
    });
  }
});

test.describe('API Endpoint Health Checks', () => {
  const API_ENDPOINTS = [
    '/api/health',
    '/api/ready',
    '/api/products',
    '/api/orders',
    '/api/customers',
    '/api/users',
    '/api/analytics/dashboard',
    '/api/inventory',
    '/api/support',
    '/api/reviews',
    '/api/returns',
    '/api/subscriptions',
    '/api/affiliates',
    '/api/campaigns',
    '/api/performance',
    '/api/notifications',
    '/api/logs'
  ];

  for (const endpoint of API_ENDPOINTS) {
    test(`API ${endpoint} should respond`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBeLessThan(500); // No server errors
    });
  }
});

test.describe('Database Integration Checks', () => {
  test('Products API should return data from database', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products`);
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('Orders API should return data from database', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/orders`);
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('Customers API should return data from database', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/customers`);
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });
});

test.describe('Multi-Tenancy Validation', () => {
  test('Products should have organizationId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      expect(data.data[0]).toHaveProperty('organizationId');
    }
  });

  test('Orders should have organizationId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/orders`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      expect(data.data[0]).toHaveProperty('organizationId');
    }
  });

  test('Customers should have organizationId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/customers`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      expect(data.data[0]).toHaveProperty('organizationId');
    }
  });
});


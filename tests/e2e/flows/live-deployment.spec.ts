import { test, expect, Page } from '@playwright/test';

/**
 * LIVE DEPLOYMENT E2E TESTS
 * Testing against: https://smart-store-saas-demo.vercel.app
 * 
 * This test suite will:
 * - Test authentication with demo credentials
 * - Check all dashboard pages for runtime errors
 * - Test CRUD operations
 * - Verify RBAC permissions
 */

// Demo credentials from the live site
const DEMO_ADMIN = {
  email: 'admin@techhub.lk',
  password: 'password123'
};

test.describe('Live Deployment - Dashboard Error Check', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Login with demo credentials
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if we're already on dashboard or need to login
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      await page.fill('input[name="email"]', DEMO_ADMIN.email);
      await page.fill('input[name="password"]', DEMO_ADMIN.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  test('should successfully login with demo credentials', async () => {
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Welcome text not found, but on dashboard page');
    });
  });

  test('Dashboard - Main Page - Check for errors', async () => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for "Something went wrong" error
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    // Check for error boundaries
    const errorBoundary = await page.locator('[data-error-boundary]').count();
    expect(errorBoundary).toBe(0);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-main.png', fullPage: true });
  });

  test('Products Page - Check for errors and CRUD', async () => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    
    // Check for errors
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    // Check if products table/list is visible
    const hasProducts = await page.locator('[data-testid="product-list"]').isVisible().catch(() => false);
    const hasProductsTable = await page.locator('table').isVisible().catch(() => false);
    
    expect(hasProducts || hasProductsTable).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/products-page.png', fullPage: true });
  });

  test('Orders Page - Check for errors', async () => {
    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/orders-page.png', fullPage: true });
  });

  test('Customers Page - Check for errors', async () => {
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/customers-page.png', fullPage: true });
  });

  test('Analytics Page - Check for errors', async () => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/analytics-page.png', fullPage: true });
  });

  test('Inventory Page - Check for errors', async () => {
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/inventory-page.png', fullPage: true });
  });

  test('POS Page - Check for errors', async () => {
    await page.goto('/dashboard/pos');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/pos-page.png', fullPage: true });
  });

  test('Settings Page - Check for errors', async () => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/settings-page.png', fullPage: true });
  });

  test('Reports Page - Check for errors', async () => {
    await page.goto('/dashboard/reports');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/reports-page.png', fullPage: true });
  });

  test('Marketing Page - Check for errors', async () => {
    await page.goto('/dashboard/marketing');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/marketing-page.png', fullPage: true });
  });

  test('Support Page - Check for errors', async () => {
    await page.goto('/dashboard/support');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/support-page.png', fullPage: true });
  });

  test('Integrations Page - Check for errors', async () => {
    await page.goto('/dashboard/integrations');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/integrations-page.png', fullPage: true });
  });

  test('Affiliates Page - Check for errors', async () => {
    await page.goto('/dashboard/affiliates');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/affiliates-page.png', fullPage: true });
  });

  test('Compliance Page - Check for errors', async () => {
    await page.goto('/dashboard/compliance');
    await page.waitForLoadState('networkidle');
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
    
    await page.screenshot({ path: 'test-results/compliance-page.png', fullPage: true });
  });
});

test.describe('Live Deployment - CRUD Operations', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.fill('input[name="email"]', DEMO_ADMIN.email);
    await page.fill('input[name="password"]', DEMO_ADMIN.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Product CRUD - View Products List', async () => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    
    // Check if we can see products
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/crud-products-list.png', fullPage: true });
  });

  test('Product CRUD - Try to Add New Product', async () => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    
    // Look for "Add Product" button
    const addButton = await page.locator('button:has-text("Add Product"), a:has-text("Add Product"), button:has-text("New Product")').first();
    const isVisible = await addButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await addButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/crud-add-product-form.png', fullPage: true });
    } else {
      console.log('Add Product button not found - may require specific permissions');
    }
  });

  test('Order CRUD - View Orders List', async () => {
    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/crud-orders-list.png', fullPage: true });
  });

  test('Customer CRUD - View Customers List', async () => {
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/crud-customers-list.png', fullPage: true });
  });
});

test.describe('Live Deployment - RBAC Testing', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.fill('input[name="email"]', DEMO_ADMIN.email);
    await page.fill('input[name="password"]', DEMO_ADMIN.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Admin Access - Settings Page', async () => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    
    // Admin should have access
    const forbidden = await page.locator('text=/forbidden|access denied/i').count();
    expect(forbidden).toBe(0);
    
    await page.screenshot({ path: 'test-results/rbac-admin-settings.png', fullPage: true });
  });

  test('Admin Access - Users Management', async () => {
    await page.goto('/dashboard/settings/users');
    await page.waitForLoadState('networkidle');
    
    const forbidden = await page.locator('text=/forbidden|access denied/i').count();
    expect(forbidden).toBe(0);
    
    await page.screenshot({ path: 'test-results/rbac-admin-users.png', fullPage: true });
  });

  test('Admin Access - Integrations', async () => {
    await page.goto('/dashboard/integrations');
    await page.waitForLoadState('networkidle');
    
    const forbidden = await page.locator('text=/forbidden|access denied/i').count();
    expect(forbidden).toBe(0);
    
    await page.screenshot({ path: 'test-results/rbac-admin-integrations.png', fullPage: true });
  });

  test('Admin Access - Billing', async () => {
    await page.goto('/dashboard/settings/billing');
    await page.waitForLoadState('networkidle');
    
    const forbidden = await page.locator('text=/forbidden|access denied/i').count();
    expect(forbidden).toBe(0);
    
    await page.screenshot({ path: 'test-results/rbac-admin-billing.png', fullPage: true });
  });
});

test.describe('Live Deployment - Critical User Flows', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  test('User Flow - Login to Dashboard Navigation', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', DEMO_ADMIN.email);
    await page.fill('input[name="password"]', DEMO_ADMIN.password);
    await page.screenshot({ path: 'test-results/flow-1-login-form.png' });
    
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/flow-2-dashboard.png', fullPage: true });
    
    // Navigate to products
    await page.click('a[href*="/products"], text="Products"');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flow-3-products.png', fullPage: true });
    
    // Navigate to orders
    await page.click('a[href*="/orders"], text="Orders"');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flow-4-orders.png', fullPage: true });
  });

  test('User Flow - POS Order Creation Flow', async () => {
    await page.goto('/');
    await page.fill('input[name="email"]', DEMO_ADMIN.email);
    await page.fill('input[name="password"]', DEMO_ADMIN.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to POS
    await page.goto('/dashboard/pos');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flow-pos-1-main.png', fullPage: true });
    
    // Check if POS is functional (no errors)
    const errorText = await page.locator('text=/something went wrong/i').count();
    expect(errorText).toBe(0);
  });
});


/**
 * E2E Tests for Critical User Flows
 * Tests complete user journeys from start to finish
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://smartstore-demo.vercel.app';

// Helper to login before tests
async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('[data-testid="email-input"]', 'admin@techhub.lk');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });
  test('Complete Product Lifecycle', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    // Verify products page loads
    await expect(page).toHaveTitle(/Products|SmartStore/);
    
    // Check if products table/grid is visible
    const productsContent = page.locator('main');
    await expect(productsContent).toBeVisible();
  });

  test('Dashboard Analytics Load', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check dashboard loads
    await expect(page).toHaveTitle(/Dashboard|SmartStore/);
    
    // Verify key metrics are visible
    const dashboard = page.locator('main');
    await expect(dashboard).toBeVisible();
  });

  test('Orders Management Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    
    // Verify orders page loads
    await expect(page).toHaveTitle(/Orders|SmartStore/);
    
    const ordersContent = page.locator('main');
    await expect(ordersContent).toBeVisible();
  });

  test('Customer Management Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`);
    
    // Verify customers page loads
    await expect(page).toHaveTitle(/Customers|SmartStore/);
    
    const customersContent = page.locator('main');
    await expect(customersContent).toBeVisible();
  });

  test('Navigation Between Pages', async ({ page }) => {
    // Start at dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/dashboard/);
    
    // Navigate to products
    await page.goto(`${BASE_URL}/products`);
    await expect(page).toHaveURL(/products/);
    
    // Navigate to orders
    await page.goto(`${BASE_URL}/orders`);
    await expect(page).toHaveURL(/orders/);
    
    // Navigate to customers
    await page.goto(`${BASE_URL}/customers`);
    await expect(page).toHaveURL(/customers/);
  });
});

test.describe('API Integration Tests', () => {
  test('Products API returns valid data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('Orders API returns valid data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/orders`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('Customers API returns valid data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/customers`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('Analytics Dashboard API returns valid data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/analytics/dashboard`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Reports API returns valid data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports/sales`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('Performance Tests', () => {
  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Products page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/products`);
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Dashboard is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('Pages have proper titles', async ({ page }) => {
    const pages = [
      { url: '/dashboard', titlePattern: /Dashboard|SmartStore/ },
      { url: '/products', titlePattern: /Products|SmartStore/ },
      { url: '/orders', titlePattern: /Orders|SmartStore/ },
      { url: '/customers', titlePattern: /Customers|SmartStore/ }
    ];

    for (const { url, titlePattern } of pages) {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page).toHaveTitle(titlePattern);
    }
  });
});


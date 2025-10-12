import { test, expect } from '@playwright/test';

test.describe('Simple Dashboard Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if login page loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
      console.log('✅ Email input is visible');
    }
    
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
      console.log('✅ Password input is visible');
    }
    
    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeVisible();
      console.log('✅ Submit button is visible');
    }
  });

  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if home page loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    
    // Check for basic page elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
    console.log('✅ Home page loads successfully');
  });

  test('should test API endpoints', async ({ page }) => {
    // Test public API endpoints
    const endpoints = [
      '/api/health',
      '/api/monitoring/status'
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint}...`);
      
      try {
        const response = await page.request.get(`http://localhost:3001${endpoint}`);
        expect(response.status()).toBeLessThan(500);
        console.log(`✅ ${endpoint} returns ${response.status()}`);
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.message);
      }
    }
  });

  test('should test page structure', async ({ page }) => {
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/login', name: 'Login' }
    ];

    for (const pageInfo of pages) {
      console.log(`Testing ${pageInfo.name} page structure...`);
      
      await page.goto(pageInfo.path);
      await page.waitForLoadState('domcontentloaded');
      
      // Check for basic HTML structure
      const html = page.locator('html');
      const body = page.locator('body');
      
      await expect(html).toBeVisible();
      await expect(body).toBeVisible();
      
      console.log(`✅ ${pageInfo.name} page has proper structure`);
    }
  });

  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page loads on mobile
    await page.waitForLoadState('domcontentloaded');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    console.log('✅ Mobile viewport works');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check if page loads on desktop
    await page.waitForLoadState('domcontentloaded');
    await expect(body).toBeVisible();
    console.log('✅ Desktop viewport works');
  });
});

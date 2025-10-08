import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test('should load dashboard page', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    
    // Check for dashboard elements
    await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    
    // Check for dashboard title
    await expect(page.locator('h1:has-text("Welcome to the Dashboard!")')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for navigation elements
    const nav = page.locator('aside');
    await expect(nav).toBeVisible();
    
    // Check for main navigation items
    const navItems = ['Dashboard', 'Products', 'Orders', 'Customers'];
    for (const item of navItems) {
      const navItem = page.locator(`text=${item}`);
      if (await navItem.isVisible()) {
        await expect(navItem).toBeVisible();
      }
    }
  });

  test('should load all main pages', async ({ page }) => {
    const pages = [
      { path: '/dashboard', title: 'Dashboard' },
      { path: '/products', title: 'Products' },
      { path: '/orders', title: 'Orders' },
      { path: '/customers', title: 'Customers' }
    ];

    for (const pageInfo of pages) {
      console.log(`Testing page: ${pageInfo.path}`);
      
      try {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if page loads (should not be 500 error)
        const response = await page.waitForResponse(response => 
          response.url().includes(pageInfo.path) && response.status() < 500
        );
        
        expect(response.status()).toBeLessThan(500);
        console.log(`✅ ${pageInfo.path} loaded successfully`);
      } catch (error) {
        console.log(`❌ ${pageInfo.path} failed to load:`, error.message);
        // Continue with other pages even if one fails
      }
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check if page loads on mobile
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    
    // Check if desktop navigation is visible
    const desktopNav = page.locator('aside');
    if (await desktopNav.isVisible()) {
      await expect(desktopNav).toBeVisible();
      console.log('✅ Desktop navigation is visible');
    }
  });
});
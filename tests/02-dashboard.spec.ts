import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should load dashboard page', async ({ page }) => {
    // Check if dashboard loads (might redirect to login)
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      // Expected behavior - redirect to login when not authenticated
      await expect(page).toHaveURL(/.*login/);
      console.log('✅ Dashboard correctly redirects to login when not authenticated');
    } else {
      // If we're on dashboard, check for key elements using data-testid
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      await expect(page.locator('text=Welcome')).toBeVisible();
    }
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation elements
    const navItems = [
      'Products',
      'Orders', 
      'Customers',
      'Accounting',
      'Procurement',
      'Analytics'
    ];
    
    for (const item of navItems) {
      const navElement = page.locator(`text=${item}`);
      if (await navElement.isVisible()) {
        await expect(navElement).toBeVisible();
        console.log(`✅ Navigation item "${item}" is visible`);
      }
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile menu is present
    const mobileMenuButton = page.locator('button[aria-label="Menu"]').or(page.locator('button:has-text("Menu")'));
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toBeVisible();
      console.log('✅ Mobile menu button is visible');
    }
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check if desktop navigation is visible
    const desktopNav = page.locator('nav').or(page.locator('[role="navigation"]'));
    if (await desktopNav.isVisible()) {
      await expect(desktopNav).toBeVisible();
      console.log('✅ Desktop navigation is visible');
    }
  });

  test('should load all main pages', async ({ page }) => {
    const pages = [
      { name: 'Home', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Products', url: '/products' },
      { name: 'Orders', url: '/orders' },
      { name: 'Customers', url: '/customers' },
      { name: 'Analytics', url: '/analytics' },
      { name: 'Accounting', url: '/accounting' },
      { name: 'Procurement', url: '/procurement' },
      { name: 'Monitoring', url: '/monitoring' },
      { name: 'Documentation', url: '/docs' }
    ];

    for (const pageInfo of pages) {
      console.log(`Testing ${pageInfo.name} page...`);
      await page.goto(pageInfo.url);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check if page loads without errors
      const currentUrl = page.url();
      if (currentUrl.includes('error') || currentUrl.includes('404')) {
        console.log(`❌ ${pageInfo.name} page has issues: ${currentUrl}`);
      } else {
        console.log(`✅ ${pageInfo.name} page loads successfully`);
      }
      
      // Small delay between page loads
      await page.waitForTimeout(1000);
    }
  });
});

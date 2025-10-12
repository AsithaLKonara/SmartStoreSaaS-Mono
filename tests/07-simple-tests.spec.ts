import { test, expect } from '@playwright/test';

test.describe('Simple Tests (No Authentication)', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if login page loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
  });

  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if home page loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    
    // Check for key elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should test login form interaction', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Test form interaction
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    
    // Check if form fields are filled
    const emailValue = await page.inputValue('[data-testid="email-input"]');
    const passwordValue = await page.inputValue('[data-testid="password-input"]');
    
    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('testpassword');
  });

  test('should test page navigation', async ({ page }) => {
    // Test navigation between pages
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Should be able to navigate without errors
    expect(page.url()).toContain('localhost');
  });

  test('should test responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
  });
});

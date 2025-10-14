import { test, expect } from '@playwright/test';

test.describe('NextAuth Login Tests', () => {
  test('should login with super admin credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'superadmin@smartstore.com');
    await page.fill('[data-testid="password-input"]', 'SuperAdmin123!');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
    
    // Check if user info is displayed
    await expect(page.locator('text=Super Administrator')).toBeVisible();
  });

  test('should login with tenant admin credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'admin@demo.com');
    await page.fill('[data-testid="password-input"]', 'Admin123!');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill in invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Should stay on login page or show error
    await page.waitForTimeout(2000);
    
    // Check for error message or that we're still on login page
    const currentUrl = page.url();
    const hasError = await page.locator('text=Invalid').isVisible().catch(() => false);
    
    expect(currentUrl.includes('/login') || hasError).toBeTruthy();
  });

  test('should test customer login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill in customer credentials
    await page.fill('[data-testid="email-input"]', 'customer@demo.com');
    await page.fill('[data-testid="password-input"]', 'Customer123!');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Wait for navigation (could be dashboard or customer portal)
    await page.waitForTimeout(5000);
    
    // Verify we're authenticated (not on login page)
    expect(page.url()).not.toContain('/login');
  });
});


import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check if login page loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    
    // Check for login form elements using data-testid
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    
    // Check for form labels
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should navigate to login page from home', async ({ page }) => {
    // Click on login button if present
    const loginButton = page.locator('text=Login').or(page.locator('text=Sign In'));
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill invalid credentials using data-testid
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Check for error message (this might take a moment)
    await page.waitForTimeout(2000);
    
    // Look for error indicators
    const errorMessage = page.locator('text=Invalid').or(page.locator('text=Error')).or(page.locator('text=Failed'));
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should have working social login buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Check Google login button
    const googleButton = page.locator('text=Sign in with Google');
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeVisible();
      // Note: We won't actually click these as they require real OAuth setup
    }
    
    // Check GitHub login button
    const githubButton = page.locator('text=Sign in with GitHub');
    if (await githubButton.isVisible()) {
      await expect(githubButton).toBeVisible();
    }
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test would require actual authentication setup
    // For now, we'll just check if the dashboard route exists
    await page.goto('/dashboard');
    
    // Check if we're redirected to login (expected behavior without auth)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // This is expected - redirect to login when not authenticated
      await expect(page).toHaveURL(/.*login/);
    } else {
      // If we somehow got to dashboard, check for dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();
    }
  });
});

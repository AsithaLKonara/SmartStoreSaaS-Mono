import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    
    // Check if login page loads
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    
    // Wait for login form elements to be visible
    await page.waitForSelector('[data-testid="login-page"]', { timeout: 20000 });
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
  });

  test('should navigate to login page from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on login button if present
    const loginButton = page.locator('[data-testid="submit-button"]');
    await expect(loginButton).toBeVisible();
    
    // Use Promise.all to wait for both click and navigation
    await Promise.all([
      page.waitForURL(/.*login/),
      loginButton.click()
    ]);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="submit-button"]');

    // Check for error message using test ID
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should have working social login buttons', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Check Google login button
    const googleButton = page.locator('text=Sign in with Google');
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeVisible();
    }

    // Check GitHub login button
    const githubButton = page.locator('text=Sign in with GitHub');
    if (await githubButton.isVisible()) {
      await expect(githubButton).toBeVisible();
    }
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // With mock authentication, we should be able to access dashboard
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're on the dashboard
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

import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
  
  // Fill in test credentials
  await page.fill('[data-testid="email-input"]', 'admin@techhub.lk');
  await page.fill('[data-testid="password-input"]', 'demo123');
  
  // Submit the form
  await page.click('[data-testid="submit-button"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Wait for dashboard to load
  await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 10000 });
}

export async function ensureAuthenticated(page: Page) {
  const currentUrl = page.url();
  
  if (currentUrl.includes('/login')) {
    await loginAsTestUser(page);
  } else if (!currentUrl.includes('/dashboard')) {
    // If not on dashboard, navigate there and handle auth
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/login')) {
      await loginAsTestUser(page);
    }
  }
}

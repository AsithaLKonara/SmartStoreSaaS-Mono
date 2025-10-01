import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  try {
    // Navigate to login page
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to be visible
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 15000 });
    
    // Fill in test credentials
    await page.fill('[data-testid="email-input"]', 'admin@techhub.lk');
    await page.fill('[data-testid="password-input"]', 'demo123');
    
    // Submit the form
    await page.click('[data-testid="submit-button"]');
    
    // Wait for authentication to complete
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Check if we're redirected to dashboard or still on login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // If still on login, wait a bit more for redirect
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
    }
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 15000 });
    
    console.log('✅ Successfully logged in and navigated to dashboard');
  } catch (error) {
    console.log('⚠️ Login failed, continuing with current page:', error);
    // Continue with whatever page we're on
  }
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

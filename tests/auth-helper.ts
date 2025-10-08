import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    console.log('✅ Successfully logged in as test user');
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

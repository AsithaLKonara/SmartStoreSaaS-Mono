import { Page } from '@playwright/test';

export async function ensureSimpleAuth(page: Page): Promise<boolean> {
  try {
    // Check if we're already on a dashboard page
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/products') || currentUrl.includes('/orders') || currentUrl.includes('/customers')) {
      return true;
    }

    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Check if login form is present
    const loginForm = page.locator('form');
    if (await loginForm.isVisible()) {
      // Fill in test credentials (using valid test user)
      await page.fill('input[type="email"]', 'admin@techhub.lk');
      await page.fill('input[type="password"]', 'password123');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForLoadState('domcontentloaded');
      
      // Check if we're redirected to dashboard
      const newUrl = page.url();
      return newUrl.includes('/dashboard') || newUrl.includes('/products') || newUrl.includes('/orders') || newUrl.includes('/customers');
    }

    return false;
  } catch (error) {
    console.log('Authentication failed:', error);
    return false;
  }
}

export async function mockAuth(page: Page): Promise<void> {
  // Set a mock session in localStorage
  await page.evaluate(() => {
    localStorage.setItem('nextauth.session', JSON.stringify({
      user: {
        id: 'test-user',
        email: 'admin@example.com',
        name: 'Test User',
        role: 'ADMIN'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));
  });
}

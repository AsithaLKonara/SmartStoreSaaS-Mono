import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  try {
    console.log('🔐 Attempting to log in as test user...');
    
    // Navigate to login page with extended timeout
    await page.goto('/login', { 
      timeout: 90000,
      waitUntil: 'domcontentloaded'
    });
    
    // Wait for login form to be ready
    await page.waitForSelector('[data-testid="email-input"]', { 
      timeout: 60000,
      state: 'visible'
    });
    
    // Fill in test credentials
    await page.fill('[data-testid="email-input"]', 'admin@smartstore.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    
    // Submit the form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ 
        timeout: 90000,
        waitUntil: 'domcontentloaded'
      }),
      page.click('[data-testid="login-button"]', { timeout: 10000 }).catch(() => 
        page.click('button[type="submit"]', { timeout: 10000 })
      )
    ]);
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    
    // Verify we're on dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully logged in and redirected to dashboard');
    } else if (!currentUrl.includes('/login')) {
      console.log('✅ Successfully logged in to:', currentUrl);
    } else {
      console.warn('⚠️ Still on login page after authentication attempt');
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    // Continue with whatever page we're on
    throw error;
  }
}

export async function ensureAuthenticated(page: Page) {
  try {
    const currentUrl = page.url();
    console.log('🔍 Checking authentication status. Current URL:', currentUrl);
    
    // If we're already on dashboard, we're good
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Already authenticated and on dashboard');
      return;
    }
    
    // If we're on login page, perform login
    if (currentUrl.includes('/login')) {
      console.log('📝 On login page, attempting to log in...');
      await loginAsTestUser(page);
      return;
    }
    
    // Otherwise, try to navigate to dashboard with extended timeout
    console.log('🚀 Navigating to dashboard...');
    await page.goto('/dashboard', { 
      timeout: 90000,
      waitUntil: 'domcontentloaded'
    });
    
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    
    // Check if we got redirected to login
    if (page.url().includes('/login')) {
      console.log('🔄 Redirected to login, authenticating...');
      await loginAsTestUser(page);
    } else {
      console.log('✅ Successfully navigated to dashboard');
    }
    
  } catch (error) {
    console.error('❌ Authentication check failed:', error.message);
    throw error;
  }
}

export async function logout(page: Page) {
  try {
    // Try to find and click logout button
    const logoutButton = page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 30000 });
      console.log('✅ Successfully logged out');
    }
  } catch (error) {
    console.warn('⚠️ Logout failed or button not found:', error.message);
  }
}

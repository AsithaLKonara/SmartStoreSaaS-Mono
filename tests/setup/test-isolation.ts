/**
 * Test Isolation Helper
 * Ensures clean state between test runs and proper role switching
 */

import { Page, BrowserContext } from '@playwright/test';

export interface TestContext {
  page: Page;
  context: BrowserContext;
}

/**
 * Clear all browser storage (cookies, localStorage, sessionStorage)
 */
export async function clearBrowserStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Clear all cookies
  const context = page.context();
  await context.clearCookies();
}

/**
 * Logout current user and clear session
 */
export async function logout(page: Page) {
  try {
    // Try to find and click sign out button
    const signOutButton = page.locator('text=Sign Out');
    if (await signOutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    // If sign out button not found, force logout via API
    await page.goto('/api/auth/signout', { waitUntil: 'networkidle' });
  }
  
  // Clear all storage
  await clearBrowserStorage(page);
  
  // Wait a bit for session to clear
  await page.waitForTimeout(500);
}

/**
 * Reset page state before each test
 */
export async function resetPageState(page: Page) {
  // Clear storage
  await clearBrowserStorage(page);
  
  // Clear any pending requests
  await page.evaluate(() => {
    // Cancel any pending fetch requests
    if ('AbortController' in window) {
      window.dispatchEvent(new Event('beforeunload'));
    }
  });
  
  // Go to a neutral page
  await page.goto('about:blank');
}

/**
 * Switch user roles (logout + clear + ready for new login)
 */
export async function switchRole(page: Page) {
  console.log('🔄 Switching user role...');
  
  // Logout current user
  await logout(page);
  
  // Reset page state
  await resetPageState(page);
  
  console.log('✅ Ready for new role login');
}

/**
 * Verify page is in clean state
 */
export async function verifyCleanState(page: Page): Promise<boolean> {
  const hasSession = await page.evaluate(() => {
    // Check if any auth-related data exists
    const hasLocalStorage = localStorage.length > 0;
    const hasSessionStorage = sessionStorage.length > 0;
    
    return hasLocalStorage || hasSessionStorage;
  });
  
  const cookies = await page.context().cookies();
  const hasAuthCookie = cookies.some(cookie => 
    cookie.name.includes('token') || 
    cookie.name.includes('session') ||
    cookie.name.includes('auth')
  );
  
  return !hasSession && !hasAuthCookie;
}

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    // If timeout, that's okay - we tried
    console.warn('⚠️ Network did not become idle within timeout');
  }
}

/**
 * Isolate test execution
 * Use this wrapper for each test that needs isolation
 */
export async function withIsolation(
  page: Page,
  testFn: () => Promise<void>
): Promise<void> {
  try {
    // Reset before test
    await resetPageState(page);
    
    // Run test
    await testFn();
    
  } finally {
    // Cleanup after test
    await logout(page);
    await clearBrowserStorage(page);
  }
}

/**
 * Test isolation fixture for Playwright
 * Use in test.beforeEach and test.afterEach
 */
export const testIsolation = {
  async beforeEach(page: Page) {
    console.log('🧹 Preparing clean test environment...');
    await resetPageState(page);
    
    const isClean = await verifyCleanState(page);
    if (!isClean) {
      console.warn('⚠️ State not fully clean, forcing cleanup...');
      await clearBrowserStorage(page);
    }
    
    console.log('✅ Test environment ready');
  },

  async afterEach(page: Page) {
    console.log('🧹 Cleaning up after test...');
    await logout(page);
    await clearBrowserStorage(page);
    console.log('✅ Cleanup complete');
  },

  async beforeAll() {
    console.log('🚀 Starting test suite with isolation...');
  },

  async afterAll() {
    console.log('🏁 Test suite complete');
  }
};

/**
 * Login helper with isolation
 */
export async function isolatedLogin(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Ensure clean state before login
  await logout(page);
  
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  
  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await page.waitForLoadState('domcontentloaded');
  
  // Verify login successful
  const url = page.url();
  if (!url.includes('/dashboard')) {
    throw new Error(`Login failed - ended up at: ${url}`);
  }
}

/**
 * Create isolated test context
 */
export async function createIsolatedContext(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  
  // Set up page with isolation
  await clearBrowserStorage(page);
  
  return page;
}




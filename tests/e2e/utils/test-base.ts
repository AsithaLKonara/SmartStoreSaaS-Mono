import { test as base } from '@playwright/test';

// Export all the usual Playwright test utilities
export { expect } from '@playwright/test';

// Extend the base test to automatically attach strict backend validation listeners
export const test = base.extend({
  page: async ({ page }, use) => {
    // 1. Fail on console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Browser Console Error: ${msg.text()}`);
      }
    });

    // 2. Fail on network errors (>= 400), ignoring 404s for static assets
    page.on('response', res => {
      if (res.status() >= 400 && res.url().includes('/api/')) {
        throw new Error(`API error (${res.status()}): ${res.url()}`);
      }
    });

    // Pass the customized page to the test
    await use(page);
  },
});

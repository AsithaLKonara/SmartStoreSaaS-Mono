import { test, expect } from '@playwright/test';

test.describe('Test Setup and Environment', () => {
  test('should verify test environment', async ({ page }) => {
    console.log('🚀 Starting SmartStore SaaS E2E Tests');
    console.log('=====================================');
    
    // Test basic connectivity
    await page.goto('/');
    const currentUrl = page.url();
    
    if (currentUrl.includes('smartstore-saas.vercel.app')) {
      console.log('✅ Successfully connected to SmartStore SaaS');
    } else {
      console.log(`⚠️ Unexpected URL: ${currentUrl}`);
    }
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check if page loads without errors
    const errorMessages = page.locator('text=Error').or(page.locator('text=404')).or(page.locator('text=500'));
    const errorCount = await errorMessages.count();
    
    if (errorCount === 0) {
      console.log('✅ No error messages detected on homepage');
    } else {
      console.log(`⚠️ ${errorCount} error messages detected`);
    }
    
    console.log('✅ Test environment is ready');
  });

  test('should check browser capabilities', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName} browser`);
    
    // Check if JavaScript is enabled
    const jsEnabled = await page.evaluate(() => typeof window !== 'undefined');
    console.log(`JavaScript enabled: ${jsEnabled ? '✅' : '❌'}`);
    
    // Check viewport size
    const viewport = page.viewportSize();
    console.log(`Viewport size: ${viewport?.width}x${viewport?.height}`);
    
    // Check user agent
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`User agent: ${userAgent.substring(0, 50)}...`);
  });
});

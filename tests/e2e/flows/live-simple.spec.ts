import { test, expect } from '@playwright/test';

/**
 * SIMPLIFIED LIVE DEPLOYMENT TESTS
 * Watch the browser as it tests your live application!
 */

const BASE_URL = 'https://smart-store-saas-demo.vercel.app';

test.describe('Live Deployment - Visual Tests', () => {
  test.setTimeout(60000); // 60 seconds per test

  test('Step 1: Visit Homepage', async ({ page }) => {
    console.log('🌐 Visiting homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/step1-homepage.png', fullPage: true });
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    expect(title).toBeTruthy();
  });

  test('Step 2: Check Login Page', async ({ page }) => {
    console.log('🔐 Checking login page...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any animations
    await page.waitForTimeout(2000);
    
    // Look for email input
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/step2-login-page.png', fullPage: true });
    
    console.log('✅ Login form is visible');
    await expect(emailInput).toBeVisible();
  });

  test('Step 3: Fill Login Form', async ({ page }) => {
    console.log('📝 Filling login form...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Fill credentials
    await page.fill('input[name="email"], input[type="email"]', 'admin@techhub.lk');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/step3-form-filled.png', fullPage: true });
    
    console.log('✅ Credentials filled');
  });

  test('Step 4: Attempt Login', async ({ page }) => {
    console.log('🚀 Attempting login...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Fill and submit
    await page.fill('input[name="email"], input[type="email"]', 'admin@techhub.lk');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // Screenshot before click
    await page.screenshot({ path: 'test-results/step4a-before-submit.png', fullPage: true });
    
    // Click sign in button
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Screenshot after click
    await page.screenshot({ path: 'test-results/step4b-after-submit.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if there's an error message
    const errorMessage = await page.locator('text=/error|invalid|failed/i').count();
    if (errorMessage > 0) {
      const errorText = await page.locator('text=/error|invalid|failed/i').first().textContent();
      console.log(`❌ Error found: ${errorText}`);
    }
  });

  test('Step 5: Check Dashboard Direct Access', async ({ page }) => {
    console.log('🏠 Checking dashboard direct access...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step5-dashboard-direct.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log(`📍 Dashboard URL: ${currentUrl}`);
    
    // Check for "Something went wrong"
    const errorText = await page.locator('text=/something went wrong/i').count();
    console.log(`❓ "Something went wrong" found: ${errorText > 0 ? 'YES' : 'NO'}`);
  });

  test('Step 6: Check Products Page', async ({ page }) => {
    console.log('📦 Checking products page...');
    await page.goto(`${BASE_URL}/dashboard/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step6-products-page.png', fullPage: true });
    
    // Check for errors
    const errorText = await page.locator('text=/something went wrong/i').count();
    console.log(`❓ Products page error: ${errorText > 0 ? 'YES - ERROR FOUND!' : 'NO - Page OK'}`);
  });

  test('Step 7: Check Orders Page', async ({ page }) => {
    console.log('📦 Checking orders page...');
    await page.goto(`${BASE_URL}/dashboard/orders`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step7-orders-page.png', fullPage: true });
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    console.log(`❓ Orders page error: ${errorText > 0 ? 'YES - ERROR FOUND!' : 'NO - Page OK'}`);
  });

  test('Step 8: Check Customers Page', async ({ page }) => {
    console.log('👥 Checking customers page...');
    await page.goto(`${BASE_URL}/dashboard/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step8-customers-page.png', fullPage: true });
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    console.log(`❓ Customers page error: ${errorText > 0 ? 'YES - ERROR FOUND!' : 'NO - Page OK'}`);
  });

  test('Step 9: Check Analytics Page', async ({ page }) => {
    console.log('📊 Checking analytics page...');
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step9-analytics-page.png', fullPage: true });
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    console.log(`❓ Analytics page error: ${errorText > 0 ? 'YES - ERROR FOUND!' : 'NO - Page OK'}`);
  });

  test('Step 10: Check Settings Page', async ({ page }) => {
    console.log('⚙️ Checking settings page...');
    await page.goto(`${BASE_URL}/dashboard/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step10-settings-page.png', fullPage: true });
    
    const errorText = await page.locator('text=/something went wrong/i').count();
    console.log(`❓ Settings page error: ${errorText > 0 ? 'YES - ERROR FOUND!' : 'NO - Page OK'}`);
  });
});



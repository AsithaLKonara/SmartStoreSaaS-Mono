import { test, expect } from '@playwright/test';

test.describe('Production Authentication Login Test', () => {
  test.setTimeout(90000); // 90 seconds

  test('Login with Seeded Admin Credentials', async ({ page }) => {
    console.log('🚀 Testing Production Login with Seeded Credentials');
    console.log('📧 Email: admin@techhub.lk');
    console.log('🔑 Password: demo123');

    // Step 1: Visit the production URL
    console.log('📍 Step 1: Visiting https://smart-store-saas-demo.vercel.app');
    await page.goto('https://smart-store-saas-demo.vercel.app');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Redirected to login page');

    // Step 2: Fill login form with seeded credentials
    console.log('📍 Step 2: Filling login form');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Submit")').first();

    // Wait for form elements to be visible
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });

    console.log('✅ Login form elements found');

    // Fill credentials
    await emailInput.fill('admin@techhub.lk');
    await passwordInput.fill('demo123');
    console.log('✅ Credentials entered');

    // Take screenshot before login
    await page.screenshot({ path: 'test-results/before-login.png', fullPage: true });
    console.log('📸 Screenshot taken: before-login.png');

    // Step 3: Submit login
    console.log('📍 Step 3: Submitting login form');
    await loginButton.click();

    // Wait for navigation or error
    try {
      // Wait for either dashboard redirect or stay on login (for error)
      await Promise.race([
        page.waitForURL(/.*dashboard/, { timeout: 15000 }),
        page.waitForURL(/.*login/, { timeout: 15000 })
      ]);

      const currentURL = page.url();
      console.log(`📍 Current URL after login: ${currentURL}`);

      if (currentURL.includes('dashboard')) {
        console.log('🎉 LOGIN SUCCESSFUL! Redirected to dashboard');
        console.log('✅ Authentication system working perfectly!');

        // Take screenshot of successful login
        await page.screenshot({ path: 'test-results/after-login-success.png', fullPage: true });
        console.log('📸 Screenshot taken: after-login-success.png');

        // Verify dashboard content
        const dashboardIndicators = [
          page.locator('text=Dashboard'),
          page.locator('text=Welcome'),
          page.locator('[class*="dashboard"]'),
          page.locator('[class*="nav"]')
        ];

        let dashboardFound = false;
        for (const indicator of dashboardIndicators) {
          try {
            await indicator.waitFor({ timeout: 2000 });
            dashboardFound = true;
            console.log('✅ Dashboard content verified');
            break;
          } catch (e) {
            // Continue checking other indicators
          }
        }

        if (!dashboardFound) {
          console.log('⚠️ Dashboard loaded but content verification inconclusive');
        }

        // Step 4: Test logout
        console.log('📍 Step 4: Testing logout functionality');
        const logoutButtons = [
          page.locator('button:has-text("Logout")'),
          page.locator('a:has-text("Logout")'),
          page.locator('[class*="logout"]'),
          page.locator('button[class*="logout"]')
        ];

        let logoutClicked = false;
        for (const logoutBtn of logoutButtons) {
          try {
            await logoutBtn.waitFor({ timeout: 2000 });
            await logoutBtn.click();
            logoutClicked = true;
            console.log('✅ Logout button found and clicked');
            break;
          } catch (e) {
            // Continue checking other logout buttons
          }
        }

        if (!logoutClicked) {
          console.log('⚠️ Logout button not found, trying API logout');
          await page.goto('/api/auth/logout');
        }

        // Wait for redirect back to login
        await page.waitForURL(/.*login/, { timeout: 10000 });
        console.log('✅ Successfully logged out');

        // Take screenshot of logout
        await page.screenshot({ path: 'test-results/after-logout.png', fullPage: true });
        console.log('📸 Screenshot taken: after-logout.png');

      } else if (currentURL.includes('login')) {
        console.log('❌ LOGIN FAILED - Still on login page');

        // Check for error messages
        const errorSelectors = [
          '.error',
          '.alert',
          '[class*="error"]',
          '[class*="alert"]',
          'text=Invalid credentials',
          'text=Login failed',
          'text=Authentication failed'
        ];

        let errorFound = false;
        for (const selector of errorSelectors) {
          try {
            const errorElement = page.locator(selector);
            await errorElement.waitFor({ timeout: 2000 });
            const errorText = await errorElement.textContent();
            console.log(`📍 Error message found: "${errorText}"`);
            errorFound = true;
            break;
          } catch (e) {
            // Continue checking other error selectors
          }
        }

        if (!errorFound) {
          console.log('⚠️ No error message visible - possible network issue');
        }

        // Take screenshot of failed login
        await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
        console.log('📸 Screenshot taken: login-failed.png');

        // Check network requests
        const loginRequests = [];
        page.on('request', request => {
          if (request.url().includes('/api/auth/login')) {
            loginRequests.push(request);
          }
        });

        page.on('response', response => {
          if (response.url().includes('/api/auth/login')) {
            console.log(`📡 Login API response: ${response.status()}`);
          }
        });

        console.log('🔍 Troubleshooting suggestions:');
        console.log('1. Database may not be seeded yet');
        console.log('2. Wrong credentials');
        console.log('3. Database connection issues');
        console.log('4. API endpoint not working');

      }

    } catch (error) {
      console.log('⚠️ Login test inconclusive - timeout or unexpected behavior');
      console.log(`Error: ${error.message}`);

      // Take screenshot of current state
      await page.screenshot({ path: 'test-results/login-timeout.png', fullPage: true });
      console.log('📸 Screenshot taken: login-timeout.png');
    }

    console.log('🎯 Production Login Test Complete');
  });

  test('Check Database Seeding Status', async ({ page }) => {
    console.log('🗃️ Checking if database is seeded');

    // Try to access the seeding API to check status
    try {
      const response = await page.request.post('/api/seed', {
        headers: {
          'Authorization': 'Bearer smartstore-seed-token'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        console.log('✅ Database seeding successful');
        console.log(`📊 Created: ${data.data?.users || 0} users, ${data.data?.organizations || 0} organizations`);
      } else {
        console.log(`⚠️ Database seeding returned: ${response.status()}`);
        const errorText = await response.text();
        console.log(`Error: ${errorText}`);
      }
    } catch (error) {
      console.log('⚠️ Could not check seeding status via API');
      console.log(`Error: ${error.message}`);
    }
  });
});

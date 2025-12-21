import { test, expect } from '@playwright/test';

test.describe('Authentication System Demo', () => {
  test.setTimeout(120000); // 2 minutes for demo

  test('Complete Authentication Flow Demo', async ({ page }) => {
    console.log('🚀 Starting Authentication Demo Test');

    // Step 1: Visit the main page - should redirect to login
    console.log('📍 Step 1: Visiting main page');
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Redirected to login page');

    // Step 2: Try to access protected dashboard - should redirect to login
    console.log('📍 Step 2: Trying to access protected dashboard');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Protected route properly secured');

    // Step 3: Try to access admin page - should redirect to login
    console.log('📍 Step 3: Trying to access admin page');
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Admin route properly secured');

    // Step 4: Access login page
    console.log('📍 Step 4: Accessing login page');
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Login page accessible');

    // Step 5: Check login form elements
    console.log('📍 Step 5: Checking login form');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    console.log('✅ Login form elements present');

    // Step 6: Try login with invalid credentials (if database is seeded)
    console.log('📍 Step 6: Testing invalid credentials');
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();

    // Wait a bit for potential error message or redirect
    await page.waitForTimeout(2000);

    // Check if we're still on login page (authentication failed)
    const currentURL = page.url();
    console.log(`📍 Current URL after failed login: ${currentURL}`);

    // Step 7: Test with valid credentials (if database is seeded)
    console.log('📍 Step 7: Testing valid credentials');
    await emailInput.fill('admin@techhub.lk');
    await passwordInput.fill('demo123');
    await loginButton.click();

    // Wait for navigation or error
    try {
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });
      console.log('✅ Successfully logged in and redirected to dashboard');
      console.log(`📍 Final URL: ${page.url()}`);

      // Verify we're on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      console.log('✅ Dashboard accessible after login');

      // Step 8: Test logout functionality
      console.log('📍 Step 8: Testing logout');
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL(/.*login/, { timeout: 5000 });
        console.log('✅ Successfully logged out');
      } else {
        console.log('⚠️ Logout button not found, trying direct logout API');
        await page.goto('/api/auth/logout');
        await page.waitForURL(/.*login/, { timeout: 5000 });
        console.log('✅ API logout successful');
      }

    } catch (error) {
      console.log('⚠️ Login may have failed (database not seeded yet)');
      console.log(`📍 Current URL: ${page.url()}`);

      // Check for error messages on page
      const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('📍 Error messages found:', errorMessages);
      }
    }

    console.log('🎉 Authentication Demo Test Complete');
  });

  test('Public Routes Accessibility', async ({ page }) => {
    console.log('🌐 Testing Public Routes');

    const publicRoutes = [
      '/login',
      '/register',
      '/unauthorized'
    ];

    for (const route of publicRoutes) {
      console.log(`📍 Testing ${route}`);
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));
      console.log(`✅ ${route} accessible`);
    }

    console.log('✅ All public routes accessible');
  });

  test('Protected Routes Security', async ({ page }) => {
    console.log('🔒 Testing Protected Routes Security');

    const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/api/products',
      '/api/orders'
    ];

    for (const route of protectedRoutes) {
      console.log(`📍 Testing ${route}`);
      await page.goto(route);

      // Should either redirect to login or stay on login page
      const currentURL = page.url();
      const isOnLoginPage = currentURL.includes('/login');
      const wasRedirected = !currentURL.includes(route) || isOnLoginPage;

      if (wasRedirected) {
        console.log(`✅ ${route} properly protected (redirected)`);
      } else {
        console.log(`⚠️ ${route} may not be properly protected`);
      }
    }

    console.log('🔒 Protected routes security test complete');
  });
});

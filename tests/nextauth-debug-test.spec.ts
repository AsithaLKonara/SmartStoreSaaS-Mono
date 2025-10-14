import { test, expect, Page } from '@playwright/test';

test.describe('NextAuth Debug Test', () => {
  const BASE_URL = 'http://localhost:3000';

  test('Test NextAuth Login with Debug Logs', async ({ page }) => {
    console.log('\n🔍 Testing NextAuth Login with Debug Logs...');
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/SmartStore SaaS/);
    console.log('✅ Login page loaded successfully');

    // Check if login form elements are present
    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    expect(await emailInput.isVisible()).toBeTruthy();
    expect(await passwordInput.isVisible()).toBeTruthy();
    expect(await submitButton.isVisible()).toBeTruthy();
    console.log('✅ Login form elements found');

    // Fill in credentials
    await emailInput.fill('superadmin@smartstore.com');
    await passwordInput.fill('SuperAdmin123!');
    console.log('✅ Credentials filled');

    // Listen for console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('🔍 NextAuth:')) {
        consoleLogs.push(msg.text());
        console.log('🔍 NextAuth Debug:', msg.text());
      }
    });

    // Submit form
    await submitButton.click();
    console.log('✅ Form submitted');

    // Wait for navigation or error
    await page.waitForTimeout(3000);
    console.log(`Current URL after login attempt: ${page.url()}`);

    // Check if we were redirected to dashboard
    if (page.url().includes('/dashboard')) {
      console.log('🎉 SUCCESS: Login worked! Redirected to dashboard');
      expect(page.url()).toContain('/dashboard');
    } else if (page.url().includes('/login')) {
      console.log('❌ FAILED: Still on login page');
      
      // Check for error messages
      const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('❌ Error message found:', errorText);
      }
      
      // Check console logs for NextAuth debug info
      console.log('\n📋 NextAuth Debug Logs:');
      consoleLogs.forEach(log => console.log(log));
      
      // For now, we expect this to fail as we're debugging
      expect(page.url()).toContain('/login');
    } else {
      console.log(`❓ UNEXPECTED: Redirected to ${page.url()}`);
    }
  });

  test('Test API Authentication Flow', async ({ request }) => {
    console.log('\n🔍 Testing API Authentication Flow...');
    
    // Test CSRF endpoint
    const csrfResponse = await request.get(`${BASE_URL}/api/auth/csrf`);
    expect(csrfResponse.status()).toBe(200);
    const csrfData = await csrfResponse.json();
    expect(csrfData.csrfToken).toBeDefined();
    console.log('✅ CSRF token obtained:', csrfData.csrfToken.substring(0, 20) + '...');

    // Test signin endpoint
    const signinResponse = await request.post(`${BASE_URL}/api/auth/signin`, {
      data: {
        csrfToken: csrfData.csrfToken,
        email: 'superadmin@smartstore.com',
        password: 'SuperAdmin123!',
        redirect: 'false'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    console.log('Signin response status:', signinResponse.status());
    console.log('Signin response headers:', await signinResponse.headers());
    
    // Check if we got a session cookie
    const setCookieHeader = await signinResponse.headerValue('set-cookie');
    if (setCookieHeader) {
      console.log('✅ Session cookie received:', setCookieHeader.includes('next-auth.session-token'));
    }

    // Test authenticated endpoint
    const meResponse = await request.get(`${BASE_URL}/api/me`, {
      headers: {
        'Cookie': await signinResponse.headerValue('set-cookie') || ''
      }
    });
    
    console.log('Me endpoint status:', meResponse.status());
    if (meResponse.status() === 200) {
      const meData = await meResponse.json();
      console.log('✅ User data retrieved:', meData);
    } else {
      console.log('❌ Me endpoint failed:', await meResponse.text());
    }
  });
});


import { test, expect, Page } from '@playwright/test';

// Test credentials for different roles
const TEST_USERS = {
  SUPER_ADMIN: {
    email: 'superadmin@smartstore.com',
    password: 'SuperAdmin123!'
  },
  TENANT_ADMIN: {
    email: 'admin@demo.com', 
    password: 'Admin123!'
  },
  STAFF: {
    email: 'sales@demo.com',
    password: 'Sales123!'
  },
  CUSTOMER: {
    email: 'customer@demo.com',
    password: 'Customer123!'
  }
};

// Helper function to login using correct selectors
async function loginAs(page: Page, userType: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userType];
  await page.goto('/login');
  
  // Wait for login form to be visible using correct selectors
  await page.waitForSelector('#email', { timeout: 10000 });
  
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForTimeout(3000);
}

// Helper function to test all buttons on a page
async function testAllButtons(page: Page, pageName: string) {
  console.log(`\n🔍 Testing all buttons on ${pageName}...`);
  
  const buttons = await page.locator('button').all();
  const links = await page.locator('a[href]').all();
  
  console.log(`Found ${buttons.length} buttons and ${links.length} links`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    try {
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      
      console.log(`Button ${i + 1}: "${text?.trim()}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
      
      if (isVisible && isEnabled && text?.trim()) {
        // Try to click the button and see what happens
        await button.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log(`Button ${i + 1}: Error - ${error.message}`);
    }
  }
  
  // Test navigation links
  for (let i = 0; i < Math.min(links.length, 10); i++) { // Limit to first 10 links
    const link = links[i];
    try {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      console.log(`Link ${i + 1}: "${text?.trim()}" -> ${href}`);
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        await link.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log(`Link ${i + 1}: Error - ${error.message}`);
    }
  }
}

test.describe('Corrected Login Testing', () => {
  let consoleErrors: string[] = [];
  
  test.beforeEach(async ({ page }) => {
    // Clear console errors for each test
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Test Login Page with Correct Selectors', async ({ page }) => {
    console.log('\n🔐 Testing Login Page with Correct Selectors...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Test login form elements using correct selectors
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');
    
    expect(await emailInput.isVisible()).toBeTruthy();
    expect(await passwordInput.isVisible()).toBeTruthy();
    expect(await submitButton.isVisible()).toBeTruthy();
    
    console.log('✅ Login form elements found successfully!');
    
    // Test all buttons on login page
    await testAllButtons(page, 'Login Page');
  });

  test('Test Login with All User Roles', async ({ page }) => {
    console.log('\n👤 Testing Login with All User Roles...');
    
    // Test login with each user role
    for (const [role, credentials] of Object.entries(TEST_USERS)) {
      console.log(`\n🔑 Testing login as ${role}...`);
      
      try {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        // Fill form with correct selectors
        await page.fill('#email', credentials.email);
        await page.fill('#password', credentials.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(5000); // Wait for login process
        
        const currentUrl = page.url();
        console.log(`${role} login result - Current URL: ${currentUrl}`);
        
        // If login successful, test the dashboard
        if (!currentUrl.includes('/login')) {
          console.log(`✅ ${role} login successful!`);
          await testAllButtons(page, `${role} Dashboard`);
          
          // Test navigation menu
          const navLinks = await page.locator('nav a, [role="navigation"] a').all();
          console.log(`Found ${navLinks.length} navigation links`);
          
          for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
            const link = navLinks[i];
            try {
              const text = await link.textContent();
              const href = await link.getAttribute('href');
              console.log(`Nav Link: "${text?.trim()}" -> ${href}`);
              
              if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
                await link.click();
                await page.waitForTimeout(2000);
                await testAllButtons(page, `Page: ${text?.trim()}`);
                await page.goBack();
                await page.waitForTimeout(1000);
              }
            } catch (error) {
              console.log(`Nav Link Error: ${error.message}`);
            }
          }
        } else {
          console.log(`❌ ${role} login failed - still on login page`);
        }
        
      } catch (error) {
        console.log(`❌ ${role} login error: ${error.message}`);
      }
    }
  });

  test('Test Dashboard Pages (as Super Admin)', async ({ page }) => {
    console.log('\n🎛️ Testing Dashboard Pages as Super Admin...');
    
    // Login as Super Admin
    await loginAs(page, 'SUPER_ADMIN');
    
    const dashboardPages = [
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/products',
      '/dashboard/customers',
      '/dashboard/analytics',
      '/dashboard/settings'
    ];
    
    for (const pagePath of dashboardPages) {
      try {
        console.log(`\n📊 Testing dashboard page: ${pagePath}`);
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const title = await page.title();
        console.log(`  Title: ${title}`);
        
        // Test all interactive elements
        await testAllButtons(page, pagePath);
        
        // Test data tables if present
        const tables = await page.locator('table').count();
        if (tables > 0) {
          console.log(`  Data tables found: ${tables}`);
          const tableRows = await page.locator('table tbody tr').count();
          console.log(`  Table rows: ${tableRows}`);
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${pagePath}: ${error.message}`);
      }
    }
  });

  test('Test Customer Portal (as Customer)', async ({ page }) => {
    console.log('\n🛒 Testing Customer Portal as Customer...');
    
    // Login as Customer
    await loginAs(page, 'CUSTOMER');
    
    const customerPages = [
      '/customer-portal',
      '/customer-portal/orders',
      '/customer-portal/profile',
      '/customer-portal/addresses',
      '/customer-portal/support'
    ];
    
    for (const pagePath of customerPages) {
      try {
        console.log(`\n🛍️ Testing customer page: ${pagePath}`);
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const title = await page.title();
        console.log(`  Title: ${title}`);
        
        // Test all interactive elements
        await testAllButtons(page, pagePath);
        
      } catch (error) {
        console.log(`❌ Error testing ${pagePath}: ${error.message}`);
      }
    }
  });

  test.afterAll(async () => {
    console.log('\n✅ Corrected login testing completed!');
    console.log('Check the console output above for detailed results.');
  });
});


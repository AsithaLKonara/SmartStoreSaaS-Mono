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

// Helper function to login
async function loginAs(page: Page, userType: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userType];
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForTimeout(3000);
}

// Helper function to check for console errors
async function checkConsoleErrors(page: Page, context: string) {
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(`Console Error in ${context}: ${msg.text()}`);
    }
  });
  return logs;
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

test.describe('Comprehensive Site Testing', () => {
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

  test('Test Home Page and Navigation', async ({ page }) => {
    console.log('\n🏠 Testing Home Page...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    
    // Test all buttons and links on home page
    await testAllButtons(page, 'Home Page');
    
    // Check for any console errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors on Home Page:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
  });

  test('Test Login Page and All User Roles', async ({ page }) => {
    console.log('\n🔐 Testing Login Page...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Test login form elements
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    expect(await emailInput.isVisible()).toBeTruthy();
    expect(await passwordInput.isVisible()).toBeTruthy();
    expect(await submitButton.isVisible()).toBeTruthy();
    
    // Test all buttons on login page
    await testAllButtons(page, 'Login Page');
    
    // Test login with each user role
    for (const [role, credentials] of Object.entries(TEST_USERS)) {
      console.log(`\n👤 Testing login as ${role}...`);
      
      try {
        await page.fill('input[name="email"]', credentials.email);
        await page.fill('input[name="password"]', credentials.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(5000); // Wait for login process
        
        const currentUrl = page.url();
        console.log(`${role} login result - Current URL: ${currentUrl}`);
        
        // If login successful, test the dashboard
        if (!currentUrl.includes('/login')) {
          console.log(`✅ ${role} login successful`);
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
          console.log(`❌ ${role} login failed`);
        }
        
        // Go back to login page for next test
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
      } catch (error) {
        console.log(`❌ ${role} login error: ${error.message}`);
      }
    }
  });

  test('Test All Public Pages', async ({ page }) => {
    console.log('\n🌐 Testing All Public Pages...');
    
    const publicPages = [
      '/',
      '/login',
      '/about',
      '/contact',
      '/pricing',
      '/features',
      '/help',
      '/privacy',
      '/terms'
    ];
    
    for (const pagePath of publicPages) {
      try {
        console.log(`\n📄 Testing page: ${pagePath}`);
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const title = await page.title();
        console.log(`  Title: ${title}`);
        
        // Test all interactive elements
        await testAllButtons(page, pagePath);
        
        // Check for broken images
        const images = await page.locator('img').all();
        for (const img of images) {
          const src = await img.getAttribute('src');
          const alt = await img.getAttribute('alt');
          console.log(`  Image: ${alt || 'No alt'} - ${src}`);
        }
        
        // Check for forms
        const forms = await page.locator('form').count();
        console.log(`  Forms found: ${forms}`);
        
      } catch (error) {
        console.log(`❌ Error testing ${pagePath}: ${error.message}`);
      }
    }
  });

  test('Test Dashboard Pages (as Super Admin)', async ({ page }) => {
    console.log('\n🎛️ Testing Dashboard Pages...');
    
    // Login as Super Admin
    await loginAs(page, 'SUPER_ADMIN');
    
    const dashboardPages = [
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/products',
      '/dashboard/customers',
      '/dashboard/analytics',
      '/dashboard/settings',
      '/dashboard/users',
      '/dashboard/tenants',
      '/dashboard/inventory',
      '/dashboard/reports'
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
        
        // Test modals if present
        const modalTriggers = await page.locator('[data-modal], [data-toggle="modal"]').all();
        for (const trigger of modalTriggers.slice(0, 3)) { // Test first 3 modals
          try {
            await trigger.click();
            await page.waitForTimeout(1000);
            const modal = page.locator('.modal, [role="dialog"]').first();
            if (await modal.isVisible()) {
              console.log(`  Modal opened successfully`);
              // Close modal
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            }
          } catch (error) {
            console.log(`  Modal error: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${pagePath}: ${error.message}`);
      }
    }
  });

  test('Test Customer Portal (as Customer)', async ({ page }) => {
    console.log('\n🛒 Testing Customer Portal...');
    
    // Login as Customer
    await loginAs(page, 'CUSTOMER');
    
    const customerPages = [
      '/customer-portal',
      '/customer-portal/orders',
      '/customer-portal/profile',
      '/customer-portal/addresses',
      '/customer-portal/support',
      '/customer-portal/wishlist'
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

  test('Test API Endpoints', async ({ page }) => {
    console.log('\n🔌 Testing API Endpoints...');
    
    const apiEndpoints = [
      '/api/health',
      '/api/auth/csrf',
      '/api/users',
      '/api/products',
      '/api/orders',
      '/api/customers'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`\n🌐 Testing API: ${endpoint}`);
        const response = await page.request.get(endpoint);
        console.log(`  Status: ${response.status()}`);
        
        if (response.status() === 200) {
          const contentType = response.headers()['content-type'];
          console.log(`  Content-Type: ${contentType}`);
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ API Error ${endpoint}: ${error.message}`);
      }
    }
  });

  test('Test Responsive Design', async ({ page }) => {
    console.log('\n📱 Testing Responsive Design...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    await page.goto('/');
    
    for (const viewport of viewports) {
      console.log(`\n📐 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check if navigation is accessible
      const nav = page.locator('nav, [role="navigation"]');
      const isNavVisible = await nav.isVisible();
      console.log(`  Navigation visible: ${isNavVisible}`);
      
      // Check for mobile menu
      if (viewport.width < 768) {
        const mobileMenu = page.locator('[data-mobile-menu], .mobile-menu, .hamburger');
        const hasMobileMenu = await mobileMenu.count() > 0;
        console.log(`  Mobile menu present: ${hasMobileMenu}`);
      }
      
      // Test buttons are clickable
      const buttons = await page.locator('button').all();
      let clickableButtons = 0;
      for (const button of buttons.slice(0, 5)) {
        try {
          if (await button.isVisible() && await button.isEnabled()) {
            clickableButtons++;
          }
        } catch (error) {
          // Ignore errors
        }
      }
      console.log(`  Clickable buttons: ${clickableButtons}/${Math.min(buttons.length, 5)}`);
    }
  });

  test.afterAll(async () => {
    console.log('\n✅ Comprehensive site testing completed!');
    console.log('Check the console output above for detailed results.');
  });
});


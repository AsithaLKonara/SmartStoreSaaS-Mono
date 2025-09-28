import { test, expect } from '@playwright/test';

test.describe('Courier Management Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create and manage courier with LKR currency', async ({ page }) => {
    // Navigate to couriers page
    await page.goto('/couriers');
    await expect(page).toHaveTitle(/Courier Management/);

    // Check LKR currency is displayed
    await expect(page.locator('text=රු')).toBeVisible();

    // Add new courier
    await page.click('button:has-text("Add Courier")');
    
    // Fill courier form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@courier.com');
    await page.fill('input[name="phone"]', '+94771234567');
    await page.selectOption('select[name="vehicleType"]', 'MOTORCYCLE');
    await page.fill('input[name="vehicleNumber"]', 'ABC-1234');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify courier was created
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=MOTORCYCLE')).toBeVisible();
  });

  test('should track delivery status updates', async ({ page }) => {
    // Navigate to deliveries tab
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Check delivery status options
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Processing')).toBeVisible();
    await expect(page.locator('text=Dispatched')).toBeVisible();
    await expect(page.locator('text=Delivered')).toBeVisible();
    await expect(page.locator('text=Returned')).toBeVisible();

    // Test status update
    const deliveryRow = page.locator('tr').first();
    await deliveryRow.locator('button:has-text("Update Status")').click();
    
    // Select new status
    await page.selectOption('select[name="status"]', 'PROCESSING');
    await page.click('button:has-text("Update")');
    
    // Verify status was updated
    await expect(deliveryRow.locator('text=PROCESSING')).toBeVisible();
  });

  test('should print delivery labels', async ({ page }) => {
    // Navigate to deliveries
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Click print label button
    const printButton = page.locator('button[title="Print Label"]').first();
    await printButton.click();

    // Verify print dialog or new window opened
    // This would typically open a new window with the label
    await expect(page.locator('text=DELIVERY LABEL')).toBeVisible();
  });

  test('should display mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to couriers page
    await page.goto('/couriers');
    
    // Check mobile layout elements
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    await expect(page.locator('text=Track Delivery')).toBeVisible();
    
    // Test mobile navigation
    await page.click('button[aria-label="Menu"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
  });

  test('should show analytics with LKR currency', async ({ page }) => {
    // Navigate to analytics tab
    await page.goto('/couriers');
    await page.click('text=Analytics');

    // Check LKR currency in analytics
    await expect(page.locator('text=රු')).toBeVisible();
    
    // Check analytics metrics
    await expect(page.locator('text=Delivery Success Rate')).toBeVisible();
    await expect(page.locator('text=Avg Delivery Time')).toBeVisible();
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    await expect(page.locator('text=Avg Rating')).toBeVisible();
  });

  test('should handle courier assignment', async ({ page }) => {
    // Navigate to deliveries
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Find unassigned delivery
    const unassignedDelivery = page.locator('tr:has-text("Unassigned")').first();
    
    if (await unassignedDelivery.count() > 0) {
      // Click assign courier button
      await unassignedDelivery.locator('button[title="Assign Courier"]').click();
      
      // Select courier
      await page.selectOption('select[name="courierId"]', { index: 1 });
      await page.click('button:has-text("Assign")');
      
      // Verify assignment
      await expect(unassignedDelivery.locator('text=Unassigned')).not.toBeVisible();
    }
  });

  test('should validate 5-6 character order numbers', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');
    
    // Check order number format
    const orderNumbers = page.locator('td:has-text("#")');
    const count = await orderNumbers.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const orderNumber = await orderNumbers.nth(i).textContent();
      const number = orderNumber?.replace('#', '').trim();
      
      // Check if order number is 5-6 characters
      expect(number?.length).toBeGreaterThanOrEqual(5);
      expect(number?.length).toBeLessThanOrEqual(6);
    }
  });

  test('should test multi-tenant isolation', async ({ page }) => {
    // Create a new organization context
    await page.goto('/auth/signup');
    
    // Fill signup form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@neworg.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="organizationName"]', 'New Test Org');
    await page.fill('input[name="organizationSlug"]', 'new-test-org');
    
    await page.click('button[type="submit"]');
    
    // Verify new organization context
    await expect(page).toHaveURL('/dashboard');
    
    // Check that couriers are empty for new organization
    await page.goto('/couriers');
    await expect(page.locator('text=No couriers found')).toBeVisible();
  });

  test('should test feature locking system', async ({ page }) => {
    // Navigate to feature settings
    await page.goto('/settings/features');
    
    // Check that required features are locked
    await expect(page.locator('text=Required').first()).toBeVisible();
    await expect(page.locator('button:has-text("Locked")').first()).toBeVisible();
    
    // Test enabling/disabling optional features
    const optionalFeature = page.locator('tr:has-text("Label Printing")');
    const toggle = optionalFeature.locator('button[role="switch"]');
    
    const isEnabled = await toggle.getAttribute('aria-checked') === 'true';
    
    // Toggle the feature
    await toggle.click();
    
    // Verify state changed
    const newState = await toggle.getAttribute('aria-checked') === 'true';
    expect(newState).toBe(!isEnabled);
  });

  test('should test color consistency', async ({ page }) => {
    // Navigate to different pages and check color consistency
    const pages = ['/dashboard', '/orders', '/products', '/couriers', '/analytics'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check primary color consistency
      const primaryButtons = page.locator('button[class*="bg-blue-"]');
      const primaryCount = await primaryButtons.count();
      
      // Check secondary color consistency
      const secondaryButtons = page.locator('button[class*="bg-gray-"]');
      const secondaryCount = await secondaryButtons.count();
      
      // Verify colors are consistent
      expect(primaryCount).toBeGreaterThan(0);
      expect(secondaryCount).toBeGreaterThan(0);
    }
  });

  test('should test all integrations', async ({ page }) => {
    // Test WooCommerce integration
    await page.goto('/integrations');
    await expect(page.locator('text=WooCommerce')).toBeVisible();
    
    // Test WhatsApp integration
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    
    // Test payment integrations
    await expect(page.locator('text=Stripe')).toBeVisible();
    await expect(page.locator('text=PayPal')).toBeVisible();
    await expect(page.locator('text=PayHere')).toBeVisible();
    
    // Test courier integrations
    await expect(page.locator('text=Sri Lanka Courier')).toBeVisible();
  });

  test('should test comprehensive analytics dashboard', async ({ page }) => {
    // Navigate to enhanced analytics
    await page.goto('/analytics/enhanced');
    
    // Check KPI cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Customers')).toBeVisible();
    await expect(page.locator('text=Avg Order Value')).toBeVisible();
    
    // Check LKR currency formatting
    await expect(page.locator('text=රු')).toBeVisible();
    
    // Check analytics sections
    await expect(page.locator('text=Revenue Trend')).toBeVisible();
    await expect(page.locator('text=Geographic Performance')).toBeVisible();
    await expect(page.locator('text=Device Analytics')).toBeVisible();
    await expect(page.locator('text=Product Performance')).toBeVisible();
    await expect(page.locator('text=Customer Segments')).toBeVisible();
    
    // Check export functionality
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
  });
});

test.describe('Courier Management Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create and manage courier with LKR currency', async ({ page }) => {
    // Navigate to couriers page
    await page.goto('/couriers');
    await expect(page).toHaveTitle(/Courier Management/);

    // Check LKR currency is displayed
    await expect(page.locator('text=රු')).toBeVisible();

    // Add new courier
    await page.click('button:has-text("Add Courier")');
    
    // Fill courier form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@courier.com');
    await page.fill('input[name="phone"]', '+94771234567');
    await page.selectOption('select[name="vehicleType"]', 'MOTORCYCLE');
    await page.fill('input[name="vehicleNumber"]', 'ABC-1234');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify courier was created
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=MOTORCYCLE')).toBeVisible();
  });

  test('should track delivery status updates', async ({ page }) => {
    // Navigate to deliveries tab
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Check delivery status options
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Processing')).toBeVisible();
    await expect(page.locator('text=Dispatched')).toBeVisible();
    await expect(page.locator('text=Delivered')).toBeVisible();
    await expect(page.locator('text=Returned')).toBeVisible();

    // Test status update
    const deliveryRow = page.locator('tr').first();
    await deliveryRow.locator('button:has-text("Update Status")').click();
    
    // Select new status
    await page.selectOption('select[name="status"]', 'PROCESSING');
    await page.click('button:has-text("Update")');
    
    // Verify status was updated
    await expect(deliveryRow.locator('text=PROCESSING')).toBeVisible();
  });

  test('should print delivery labels', async ({ page }) => {
    // Navigate to deliveries
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Click print label button
    const printButton = page.locator('button[title="Print Label"]').first();
    await printButton.click();

    // Verify print dialog or new window opened
    // This would typically open a new window with the label
    await expect(page.locator('text=DELIVERY LABEL')).toBeVisible();
  });

  test('should display mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to couriers page
    await page.goto('/couriers');
    
    // Check mobile layout elements
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    await expect(page.locator('text=Track Delivery')).toBeVisible();
    
    // Test mobile navigation
    await page.click('button[aria-label="Menu"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
  });

  test('should show analytics with LKR currency', async ({ page }) => {
    // Navigate to analytics tab
    await page.goto('/couriers');
    await page.click('text=Analytics');

    // Check LKR currency in analytics
    await expect(page.locator('text=රු')).toBeVisible();
    
    // Check analytics metrics
    await expect(page.locator('text=Delivery Success Rate')).toBeVisible();
    await expect(page.locator('text=Avg Delivery Time')).toBeVisible();
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    await expect(page.locator('text=Avg Rating')).toBeVisible();
  });

  test('should handle courier assignment', async ({ page }) => {
    // Navigate to deliveries
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Find unassigned delivery
    const unassignedDelivery = page.locator('tr:has-text("Unassigned")').first();
    
    if (await unassignedDelivery.count() > 0) {
      // Click assign courier button
      await unassignedDelivery.locator('button[title="Assign Courier"]').click();
      
      // Select courier
      await page.selectOption('select[name="courierId"]', { index: 1 });
      await page.click('button:has-text("Assign")');
      
      // Verify assignment
      await expect(unassignedDelivery.locator('text=Unassigned')).not.toBeVisible();
    }
  });

  test('should validate 5-6 character order numbers', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');
    
    // Check order number format
    const orderNumbers = page.locator('td:has-text("#")');
    const count = await orderNumbers.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const orderNumber = await orderNumbers.nth(i).textContent();
      const number = orderNumber?.replace('#', '').trim();
      
      // Check if order number is 5-6 characters
      expect(number?.length).toBeGreaterThanOrEqual(5);
      expect(number?.length).toBeLessThanOrEqual(6);
    }
  });

  test('should test multi-tenant isolation', async ({ page }) => {
    // Create a new organization context
    await page.goto('/auth/signup');
    
    // Fill signup form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@neworg.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="organizationName"]', 'New Test Org');
    await page.fill('input[name="organizationSlug"]', 'new-test-org');
    
    await page.click('button[type="submit"]');
    
    // Verify new organization context
    await expect(page).toHaveURL('/dashboard');
    
    // Check that couriers are empty for new organization
    await page.goto('/couriers');
    await expect(page.locator('text=No couriers found')).toBeVisible();
  });

  test('should test feature locking system', async ({ page }) => {
    // Navigate to feature settings
    await page.goto('/settings/features');
    
    // Check that required features are locked
    await expect(page.locator('text=Required').first()).toBeVisible();
    await expect(page.locator('button:has-text("Locked")').first()).toBeVisible();
    
    // Test enabling/disabling optional features
    const optionalFeature = page.locator('tr:has-text("Label Printing")');
    const toggle = optionalFeature.locator('button[role="switch"]');
    
    const isEnabled = await toggle.getAttribute('aria-checked') === 'true';
    
    // Toggle the feature
    await toggle.click();
    
    // Verify state changed
    const newState = await toggle.getAttribute('aria-checked') === 'true';
    expect(newState).toBe(!isEnabled);
  });

  test('should test color consistency', async ({ page }) => {
    // Navigate to different pages and check color consistency
    const pages = ['/dashboard', '/orders', '/products', '/couriers', '/analytics'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check primary color consistency
      const primaryButtons = page.locator('button[class*="bg-blue-"]');
      const primaryCount = await primaryButtons.count();
      
      // Check secondary color consistency
      const secondaryButtons = page.locator('button[class*="bg-gray-"]');
      const secondaryCount = await secondaryButtons.count();
      
      // Verify colors are consistent
      expect(primaryCount).toBeGreaterThan(0);
      expect(secondaryCount).toBeGreaterThan(0);
    }
  });

  test('should test all integrations', async ({ page }) => {
    // Test WooCommerce integration
    await page.goto('/integrations');
    await expect(page.locator('text=WooCommerce')).toBeVisible();
    
    // Test WhatsApp integration
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    
    // Test payment integrations
    await expect(page.locator('text=Stripe')).toBeVisible();
    await expect(page.locator('text=PayPal')).toBeVisible();
    await expect(page.locator('text=PayHere')).toBeVisible();
    
    // Test courier integrations
    await expect(page.locator('text=Sri Lanka Courier')).toBeVisible();
  });

  test('should test comprehensive analytics dashboard', async ({ page }) => {
    // Navigate to enhanced analytics
    await page.goto('/analytics/enhanced');
    
    // Check KPI cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Customers')).toBeVisible();
    await expect(page.locator('text=Avg Order Value')).toBeVisible();
    
    // Check LKR currency formatting
    await expect(page.locator('text=රු')).toBeVisible();
    
    // Check analytics sections
    await expect(page.locator('text=Revenue Trend')).toBeVisible();
    await expect(page.locator('text=Geographic Performance')).toBeVisible();
    await expect(page.locator('text=Device Analytics')).toBeVisible();
    await expect(page.locator('text=Product Performance')).toBeVisible();
    await expect(page.locator('text=Customer Segments')).toBeVisible();
    
    // Check export functionality
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
  });
});

test.describe('Courier Management Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create and manage courier with LKR currency', async ({ page }) => {
    // Navigate to couriers page
    await page.goto('/couriers');
    await expect(page).toHaveTitle(/Courier Management/);

    // Check LKR currency is displayed
    await expect(page.locator('text=රු')).toBeVisible();

    // Add new courier
    await page.click('button:has-text("Add Courier")');
    
    // Fill courier form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@courier.com');
    await page.fill('input[name="phone"]', '+94771234567');
    await page.selectOption('select[name="vehicleType"]', 'MOTORCYCLE');
    await page.fill('input[name="vehicleNumber"]', 'ABC-1234');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify courier was created
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=MOTORCYCLE')).toBeVisible();
  });

  test('should track delivery status updates', async ({ page }) => {
    // Navigate to deliveries tab
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Check delivery status options
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Processing')).toBeVisible();
    await expect(page.locator('text=Dispatched')).toBeVisible();
    await expect(page.locator('text=Delivered')).toBeVisible();
    await expect(page.locator('text=Returned')).toBeVisible();

    // Test status update
    const deliveryRow = page.locator('tr').first();
    await deliveryRow.locator('button:has-text("Update Status")').click();
    
    // Select new status
    await page.selectOption('select[name="status"]', 'PROCESSING');
    await page.click('button:has-text("Update")');
    
    // Verify status was updated
    await expect(deliveryRow.locator('text=PROCESSING')).toBeVisible();
  });

  test('should print delivery labels', async ({ page }) => {
    // Navigate to deliveries
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Click print label button
    const printButton = page.locator('button[title="Print Label"]').first();
    await printButton.click();

    // Verify print dialog or new window opened
    // This would typically open a new window with the label
    await expect(page.locator('text=DELIVERY LABEL')).toBeVisible();
  });

  test('should display mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to couriers page
    await page.goto('/couriers');
    
    // Check mobile layout elements
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    await expect(page.locator('text=Track Delivery')).toBeVisible();
    
    // Test mobile navigation
    await page.click('button[aria-label="Menu"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
  });

  test('should show analytics with LKR currency', async ({ page }) => {
    // Navigate to analytics tab
    await page.goto('/couriers');
    await page.click('text=Analytics');

    // Check LKR currency in analytics
    await expect(page.locator('text=රු')).toBeVisible();
    
    // Check analytics metrics
    await expect(page.locator('text=Delivery Success Rate')).toBeVisible();
    await expect(page.locator('text=Avg Delivery Time')).toBeVisible();
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    await expect(page.locator('text=Avg Rating')).toBeVisible();
  });

  test('should handle courier assignment', async ({ page }) => {
    // Navigate to deliveries
    await page.goto('/couriers');
    await page.click('text=Deliveries');

    // Find unassigned delivery
    const unassignedDelivery = page.locator('tr:has-text("Unassigned")').first();
    
    if (await unassignedDelivery.count() > 0) {
      // Click assign courier button
      await unassignedDelivery.locator('button[title="Assign Courier"]').click();
      
      // Select courier
      await page.selectOption('select[name="courierId"]', { index: 1 });
      await page.click('button:has-text("Assign")');
      
      // Verify assignment
      await expect(unassignedDelivery.locator('text=Unassigned')).not.toBeVisible();
    }
  });

  test('should validate 5-6 character order numbers', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');
    
    // Check order number format
    const orderNumbers = page.locator('td:has-text("#")');
    const count = await orderNumbers.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const orderNumber = await orderNumbers.nth(i).textContent();
      const number = orderNumber?.replace('#', '').trim();
      
      // Check if order number is 5-6 characters
      expect(number?.length).toBeGreaterThanOrEqual(5);
      expect(number?.length).toBeLessThanOrEqual(6);
    }
  });

  test('should test multi-tenant isolation', async ({ page }) => {
    // Create a new organization context
    await page.goto('/auth/signup');
    
    // Fill signup form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@neworg.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="organizationName"]', 'New Test Org');
    await page.fill('input[name="organizationSlug"]', 'new-test-org');
    
    await page.click('button[type="submit"]');
    
    // Verify new organization context
    await expect(page).toHaveURL('/dashboard');
    
    // Check that couriers are empty for new organization
    await page.goto('/couriers');
    await expect(page.locator('text=No couriers found')).toBeVisible();
  });

  test('should test feature locking system', async ({ page }) => {
    // Navigate to feature settings
    await page.goto('/settings/features');
    
    // Check that required features are locked
    await expect(page.locator('text=Required').first()).toBeVisible();
    await expect(page.locator('button:has-text("Locked")').first()).toBeVisible();
    
    // Test enabling/disabling optional features
    const optionalFeature = page.locator('tr:has-text("Label Printing")');
    const toggle = optionalFeature.locator('button[role="switch"]');
    
    const isEnabled = await toggle.getAttribute('aria-checked') === 'true';
    
    // Toggle the feature
    await toggle.click();
    
    // Verify state changed
    const newState = await toggle.getAttribute('aria-checked') === 'true';
    expect(newState).toBe(!isEnabled);
  });

  test('should test color consistency', async ({ page }) => {
    // Navigate to different pages and check color consistency
    const pages = ['/dashboard', '/orders', '/products', '/couriers', '/analytics'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check primary color consistency
      const primaryButtons = page.locator('button[class*="bg-blue-"]');
      const primaryCount = await primaryButtons.count();
      
      // Check secondary color consistency
      const secondaryButtons = page.locator('button[class*="bg-gray-"]');
      const secondaryCount = await secondaryButtons.count();
      
      // Verify colors are consistent
      expect(primaryCount).toBeGreaterThan(0);
      expect(secondaryCount).toBeGreaterThan(0);
    }
  });

  test('should test all integrations', async ({ page }) => {
    // Test WooCommerce integration
    await page.goto('/integrations');
    await expect(page.locator('text=WooCommerce')).toBeVisible();
    
    // Test WhatsApp integration
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    
    // Test payment integrations
    await expect(page.locator('text=Stripe')).toBeVisible();
    await expect(page.locator('text=PayPal')).toBeVisible();
    await expect(page.locator('text=PayHere')).toBeVisible();
    
    // Test courier integrations
    await expect(page.locator('text=Sri Lanka Courier')).toBeVisible();
  });

  test('should test comprehensive analytics dashboard', async ({ page }) => {
    // Navigate to enhanced analytics
    await page.goto('/analytics/enhanced');
    
    // Check KPI cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Customers')).toBeVisible();
    await expect(page.locator('text=Avg Order Value')).toBeVisible();
    
    // Check LKR currency formatting
    await expect(page.locator('text=රු')).toBeVisible();
    
    // Check analytics sections
    await expect(page.locator('text=Revenue Trend')).toBeVisible();
    await expect(page.locator('text=Geographic Performance')).toBeVisible();
    await expect(page.locator('text=Device Analytics')).toBeVisible();
    await expect(page.locator('text=Product Performance')).toBeVisible();
    await expect(page.locator('text=Customer Segments')).toBeVisible();
    
    // Check export functionality
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
  });
});

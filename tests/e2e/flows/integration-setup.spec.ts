import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Integration Setup and Testing', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'basic');
  });

  test('admin can configure Stripe integration', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    // Navigate to integrations
    await page.goto('/dashboard/integrations');
    await expect(page.locator('text=Integrations')).toBeVisible();
    
    // Find Stripe card and click setup
    await page.locator('text=Stripe').click();
    
    // Fill Stripe credentials (test mode)
    await page.fill('input[name="publishableKey"]', 'pk_test_1234567890');
    await page.fill('input[name="secretKey"]', 'sk_test_1234567890');
    
    // Test connection
    await page.click('button:text("Test Connection")');
    
    // Should show success or error
    await expect(page.locator('text=Testing')).toBeVisible();
    
    // Save configuration
    await page.click('button:text("Save")');
    await expect(page.locator('text=Stripe integration saved')).toBeVisible();
    
    // Verify integration is now active
    await page.goto('/dashboard/integrations');
    await expect(page.locator('text=Stripe').locator('..').locator('text=Active')).toBeVisible();
  });

  test('admin can configure Email integration', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/integrations/email');
    
    // Fill SendGrid credentials
    await page.fill('input[name="apiKey"]', 'SG.test_api_key_1234567890');
    await page.fill('input[name="fromEmail"]', 'noreply@smartstore.test');
    await page.fill('input[name="fromName"]', 'SmartStore Test');
    
    // Test email
    await page.fill('input[name="testEmail"]', 'test@example.com');
    await page.click('button:text("Send Test Email")');
    
    await expect(page.locator('text=Test email sent')).toBeVisible({ timeout: 10000 });
    
    // Save
    await page.click('button:text("Save Configuration")');
    await expect(page.locator('text=Email integration saved')).toBeVisible();
  });

  test('admin can configure WooCommerce sync', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/integrations/woocommerce');
    
    // Fill WooCommerce credentials
    await page.fill('input[name="storeUrl"]', 'https://test-store.myshopify.com');
    await page.fill('input[name="consumerKey"]', 'ck_test_1234567890');
    await page.fill('input[name="consumerSecret"]', 'cs_test_1234567890');
    
    // Test connection
    await page.click('button:text("Verify Connection")');
    
    // Configure sync settings
    await page.check('input[name="syncProducts"]');
    await page.check('input[name="syncOrders"]');
    await page.check('input[name="syncInventory"]');
    
    // Set sync frequency
    await page.selectOption('select[name="syncFrequency"]', 'hourly');
    
    // Save
    await page.click('button:text("Save & Activate")');
    await expect(page.locator('text=WooCommerce integration activated')).toBeVisible();
    
    // Trigger manual sync
    await page.click('button:text("Sync Now")');
    await expect(page.locator('text=Sync started')).toBeVisible();
    
    // View sync logs
    await page.click('button:text("View Logs")');
    await expect(page.locator('text=Sync History')).toBeVisible();
  });

  test('staff cannot access integration setup', async ({ page }) => {
    await loginViaUI(page, 'staffSales');
    
    // Try to access integrations
    await page.goto('/dashboard/integrations');
    
    // Should be redirected or show unauthorized
    await expect(page).not.toHaveURL(/\/integrations$/);
  });

  test('admin can view integration logs and statistics', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/integrations/email');
    
    // View email statistics
    await page.click('text=Statistics');
    
    await expect(page.locator('text=Total Sent')).toBeVisible();
    await expect(page.locator('text=Delivered')).toBeVisible();
    await expect(page.locator('text=Opened')).toBeVisible();
    await expect(page.locator('text=Clicked')).toBeVisible();
    
    // View logs
    await page.click('text=Logs');
    await expect(page.locator('text=Email Delivery Logs')).toBeVisible();
  });
});


import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase, createTestOrder } from '../utils/test-data';

test.describe('Returns and Refunds Workflow', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'orders');
  });

  test('customer can request return and receive refund', async ({ page, request }) => {
    // Step 1: Customer logs in and views order
    await loginViaUI(page, 'customer');
    
    await page.goto('/customer-portal/orders');
    await expect(page.locator('text=My Orders')).toBeVisible();
    
    // Click first order
    await page.locator('[data-testid="order-row"]').first().click();
    
    // Step 2: Request return
    await page.click('button:text("Request Return")');
    
    // Select items to return
    await page.check('input[type="checkbox"][data-item-id]');
    
    // Select reason
    await page.selectOption('select[name="reason"]', 'size_issue');
    await page.fill('textarea[name="description"]', 'Size does not fit properly');
    
    // Optional: Upload photos
    // await page.setInputFiles('input[type="file"]', 'tests/e2e/fixtures/return-photo.jpg');
    
    // Submit return request
    await page.click('button:text("Submit Return Request")');
    
    // Verify return created
    await expect(page.locator('text=Return request submitted')).toBeVisible();
    await expect(page.locator('text=RET-')).toBeVisible();
    
    const returnNumberElement = await page.locator('text=RET-').first();
    const returnNumber = await returnNumberElement.textContent();
    
    // Step 3: Admin reviews and approves
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/returns');
    await expect(page.locator(`text=${returnNumber}`)).toBeVisible();
    
    // Click to view details
    await page.locator(`text=${returnNumber}`).click();
    
    // Review return details
    await expect(page.locator('text=Size does not fit properly')).toBeVisible();
    
    // Approve return
    await page.click('button:text("Approve Return")');
    await page.fill('textarea[name="approvalNotes"]', 'Return approved - customer can ship back');
    await page.click('button:text("Confirm Approval")');
    
    // Verify status updated
    await expect(page.locator('text=Status: Approved')).toBeVisible();
    
    // Step 4: Mark as received
    await page.click('button:text("Mark as Received")');
    await page.selectOption('select[name="condition"]', 'good');
    await page.fill('textarea[name="inspectionNotes"]', 'Product in good condition');
    await page.check('input[name="restockItem"]');
    await page.click('button:text("Confirm Receipt")');
    
    // Verify status
    await expect(page.locator('text=Status: Received')).toBeVisible();
    
    // Step 5: Process refund
    await page.click('button:text("Process Refund")');
    
    // Select refund method
    await page.selectOption('select[name="refundMethod"]', 'original_payment');
    
    // Verify refund amount
    await expect(page.locator('text=29.99')).toBeVisible();
    
    // Confirm refund
    await page.click('button:text("Confirm Refund")');
    
    // Verify refund processed
    await expect(page.locator('text=Refund processed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Status: Refunded')).toBeVisible();
    
    // Step 6: Customer sees refund
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'customer');
    
    await page.goto('/customer-portal/orders');
    await page.locator(`text=${returnNumber}`).click();
    
    await expect(page.locator('text=Refunded')).toBeVisible();
    await expect(page.locator('text=29.99')).toBeVisible();
  });

  test('admin can reject return request', async ({ page }) => {
    await loginViaUI(page, 'customer');
    
    // Create return request
    await page.goto('/customer-portal/orders');
    await page.locator('[data-testid="order-row"]').first().click();
    await page.click('button:text("Request Return")');
    await page.check('input[type="checkbox"][data-item-id]');
    await page.selectOption('select[name="reason"]', 'changed_mind');
    await page.click('button:text("Submit Return Request")');
    
    const returnNumber = await page.locator('text=RET-').first().textContent();
    
    // Admin rejects
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/returns');
    await page.locator(`text=${returnNumber}`).click();
    
    await page.click('button:text("Reject Return")');
    await page.fill('textarea[name="rejectionReason"]', 'Return window expired');
    await page.click('button:text("Confirm Rejection")');
    
    // Verify rejected
    await expect(page.locator('text=Status: Rejected')).toBeVisible();
    
    // Customer sees rejection
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'customer');
    
    await page.goto('/customer-portal/orders');
    await expect(page.locator(`text=${returnNumber}`)).toBeVisible();
    await page.locator(`text=${returnNumber}`).click();
    
    await expect(page.locator('text=Rejected')).toBeVisible();
    await expect(page.locator('text=Return window expired')).toBeVisible();
  });

  test('admin can issue store credit instead of refund', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/returns');
    
    // Find approved return
    await page.locator('[data-status="approved"]').first().click();
    
    // Mark as received
    await page.click('button:text("Mark as Received")');
    await page.check('input[name="restockItem"]');
    await page.click('button:text("Confirm Receipt")');
    
    // Process refund as store credit
    await page.click('button:text("Process Refund")');
    await page.selectOption('select[name="refundMethod"]', 'store_credit');
    await page.click('button:text("Confirm Refund")');
    
    // Verify store credit issued
    await expect(page.locator('text=Store credit issued')).toBeVisible();
    
    // Verify customer loyalty points or credit balance updated
    await page.goto('/dashboard/customers');
    await page.fill('input[placeholder*="Search"]', 'customer+test@smartstore.test');
    await page.locator('[data-testid="customer-row"]').first().click();
    
    // Should show store credit
    await expect(page.locator('text=Store Credit')).toBeVisible();
  });
});


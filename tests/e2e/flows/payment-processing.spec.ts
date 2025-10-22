import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'full');
  });

  test('customer can complete checkout with Stripe', async ({ page }) => {
    await loginViaUI(page, 'customer');
    
    // Add product to cart
    await page.goto('/portal/products');
    await page.locator('[data-product]').first().click();
    await page.click('button:text("Add to Cart")');
    
    // Go to cart
    await page.goto('/portal/cart');
    await page.click('button:text("Checkout")');
    
    // Fill shipping details
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="city"]', 'Colombo');
    await page.fill('input[name="postalCode"]', '00100');
    await page.fill('input[name="phone"]', '+94771234567');
    
    // Select Stripe payment
    await page.click('input[value="stripe"]');
    
    // Fill Stripe test card
    await page.fill('input[name="cardNumber"]', '4242 4242 4242 4242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="cardholderName"]', 'Test Customer');
    
    // Place order
    await page.click('button:text("Place Order")');
    
    // Wait for payment processing
    await expect(page.locator('text=Processing payment')).toBeVisible();
    
    // Verify order confirmation
    await expect(page.locator('text=Order confirmed')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Order #')).toBeVisible();
    await expect(page.locator('text=Thank you')).toBeVisible();
  });

  test('payment fails with invalid card', async ({ page }) => {
    await loginViaUI(page, 'customer');
    
    await page.goto('/portal/products');
    await page.locator('[data-product]').first().click();
    await page.click('button:text("Add to Cart")');
    await page.goto('/portal/cart');
    await page.click('button:text("Checkout")');
    
    // Fill shipping details
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="phone"]', '+94771234567');
    
    // Use declined test card
    await page.click('input[value="stripe"]');
    await page.fill('input[name="cardNumber"]', '4000 0000 0000 0002'); // Declined card
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    
    // Try to place order
    await page.click('button:text("Place Order")');
    
    // Should show error
    await expect(page.locator('text=Payment failed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=declined')).toBeVisible();
  });

  test('admin can process refund', async ({ page, request }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    // Find paid order
    await page.goto('/dashboard/orders');
    await page.fill('input[placeholder*="Search"]', 'CONFIRMED');
    
    const paidOrder = page.locator('[data-status="CONFIRMED"]').first();
    await paidOrder.click();
    
    // Process refund
    await page.click('button:text("Refund")');
    
    // Select full refund
    await page.click('input[value="full"]');
    
    // Enter reason
    await page.fill('textarea[name="refundReason"]', 'Customer requested refund');
    
    // Confirm refund
    await page.click('button:text("Process Refund")');
    
    // Wait for processing
    await expect(page.locator('text=Processing refund')).toBeVisible();
    
    // Verify refund completed
    await expect(page.locator('text=Refund successful')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Status: Refunded')).toBeVisible();
  });

  test('partial refund is processed correctly', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/orders');
    await page.locator('[data-status="CONFIRMED"]').first().click();
    
    // Process partial refund
    await page.click('button:text("Refund")');
    await page.click('input[value="partial"]');
    
    // Select items to refund
    await page.check('input[type="checkbox"][data-item="0"]');
    
    // Verify calculated amount
    const refundAmount = await page.locator('[data-refund-amount]').textContent();
    expect(parseFloat(refundAmount || '0')).toBeGreaterThan(0);
    
    // Confirm
    await page.fill('textarea[name="refundReason"]', 'Partial item refund');
    await page.click('button:text("Process Refund")');
    
    await expect(page.locator('text=Partial refund successful')).toBeVisible({ timeout: 15000 });
  });

  test('transaction history shows all payments', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/payments');
    
    // Should show payment transactions
    await expect(page.locator('text=Payment Transactions')).toBeVisible();
    
    // Filter by status
    await page.selectOption('select[name="status"]', 'succeeded');
    
    // Export transactions
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:text("Export")'),
    ]);
    
    expect(download.suggestedFilename()).toContain('transactions');
  });
});


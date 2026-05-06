
import { test, expect } from '../utils/test-base';
import { loginViaUI } from '../utils/auth';

/**
 * Enterprise QA Edge Case & Chaos Audit
 * Validates resilience against bad input, low stock, and invalid state
 */
test.describe('Edge Case & Chaos Resilience', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Tenant Admin for most tests
    await loginViaUI(page, 'tenantAdmin');
  });

  test('Inventory Resilience: Blocks checkout for zero/low inventory', async ({ page }) => {
    // Navigate to a known product
    await page.goto('/dashboard/products');
    
    // We expect products to exist from global setup
    const firstProduct = page.locator('table tr').nth(1);
    await expect(firstProduct).toBeVisible();
    
    // Go to storefront
    await page.goto('/shop');
    
    // Try to find a product card
    const productCard = page.locator('text=Premium T-Shirt').first();
    if (await productCard.isVisible()) {
        await productCard.click();
        
        // Try to add huge amount to cart
        const qtyInput = page.locator('input[name="quantity"]');
        if (await qtyInput.isVisible()) {
            await qtyInput.fill('99999');
            // The system should prevent this or show error on add to cart
            await page.click('button:text("Add to Cart")');
            
            // Check for error feedback
            await expect(page.locator('body')).toContainText(/Insufficient|stock|limit/i);
        }
    }
  });

  test('Cart Resilience: Blocks checkout with empty cart', async ({ page }) => {
    // Clear cart first if needed (usually a new session is clean)
    await page.goto('/marketplace/checkout'); // Direct navigation attempt
    
    // Expect redirect back to shop or cart with an error
    await expect(page).not.toHaveURL(/\/checkout\/payment/);
    await expect(page.locator('body')).toContainText(/empty|no items/i);
  });

  test('Data Integrity: Rejects duplicate SKUs during creation', async ({ page }) => {
    await page.goto('/dashboard/products/new');
    
    const existingSku = 'TSHIRT-001'; // From 'full' seed
    
    await page.fill('input[name="name"]', 'Duplicate SKU Test');
    await page.fill('input[name="sku"]', existingSku);
    await page.fill('input[name="price"]', '99.99');
    
    await page.click('button:text("Publish")');
    
    // Expect error validation message
    await expect(page.locator('text=SKU already exists')).toBeVisible();
  });

  test('Price Resilience: Rejects negative price', async ({ page }) => {
    await page.goto('/dashboard/products/new');
    
    await page.fill('input[name="name"]', 'Negative Price Test');
    await page.fill('input[name="sku"]', `NEG-${Date.now()}`);
    await page.fill('input[name="price"]', '-10.00');
    
    await page.click('button:text("Publish")');
    
    // System should either block it via HTML5 validation or show server error
    // If it allows it, that's a FAIL. We expect it to block.
    const priceError = page.locator('text=Price must be positive');
    await expect(page.locator('body')).toContainText(/must be|positive|invalid/i);
  });

  test('Security Chaos: XSS Injection Sanitization Check', async ({ page }) => {
    await page.goto('/dashboard/products/new');
    
    const xssPayload = '<script>console.log("XSS_TRIGGERED")</script>';
    await page.fill('input[name="name"]', `XSS-Test-${xssPayload}`);
    await page.fill('input[name="sku"]', `XSS-${Date.now()}`);
    await page.fill('input[name="price"]', '10.00');
    
    await page.click('button:text("Publish")');
    
    // Verification: Go to product list and ensure script is NOT rendered as HTML
    await page.goto('/dashboard/products');
    
    const content = await page.content();
    // It should be escaped, so it shouldn't be found as a raw tag in the DOM
    expect(content).not.toContain('<script>console.log("XSS_TRIGGERED")</script>');
  });

});

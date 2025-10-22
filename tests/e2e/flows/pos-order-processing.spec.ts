import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('POS Order Processing (Staff)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'pos');
  });

  test('staff can create POS order and complete fulfillment workflow', async ({ page }) => {
    // Login as sales staff
    await loginViaUI(page, 'staffSales');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Step 1: Navigate to POS
    await page.goto('/dashboard/pos');
    await expect(page.locator('text=Point of Sale')).toBeVisible();
    
    // Step 2: Search and add product
    await page.fill('input[placeholder*="Search"]', 'Premium T-Shirt');
    await page.waitForTimeout(500); // Wait for search results
    
    const addButton = page.locator('button:text("Add")').first();
    await addButton.click();
    
    // Verify product added to cart
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
    await expect(page.locator('text=29.99')).toBeVisible();
    
    // Step 3: Adjust quantity
    await page.fill('input[type="number"]', '2');
    await expect(page.locator('text=59.98')).toBeVisible(); // 29.99 * 2
    
    // Step 4: Select customer (or walk-in)
    await page.click('button:text("Select Customer")');
    await page.click('text=Walk-in Customer');
    
    // Step 5: Complete payment
    await page.click('button:text("Complete Payment")');
    await page.click('button:text("Cash")'); // Payment method
    
    // Step 6: Verify order created
    await expect(page.locator('text=Order created')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ORD-')).toBeVisible();
    
    // Get order number for fulfillment
    const orderNumber = await page.locator('text=ORD-').first().textContent();
    
    // Step 7: Navigate to fulfillment
    await page.goto('/dashboard/fulfillment');
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();
    
    // Step 8: Start picking process
    await page.locator(`text=${orderNumber}`).click();
    await page.click('button:text("Start Picking")');
    
    // Check off items
    await page.check('input[type="checkbox"]');
    await page.click('button:text("Complete Picking")');
    
    // Step 9: Pack order
    await page.click('button:text("Pack Order")');
    await page.fill('input[placeholder*="Box"]', 'Medium Box');
    await page.fill('input[placeholder*="Weight"]', '0.5');
    await page.click('button:text("Complete Packing")');
    
    // Step 10: Generate shipping label
    await page.click('button:text("Generate Label")');
    await expect(page.locator('text=Label generated')).toBeVisible();
    
    // Step 11: Mark as shipped
    await page.fill('input[placeholder*="Tracking"]', 'TRACK123456');
    await page.click('button:text("Mark as Shipped")');
    
    // Step 12: Verify order status updated
    await expect(page.locator('text=Shipped')).toBeVisible();
    
    // Verify in orders list
    await page.goto('/dashboard/orders');
    await page.locator(`text=${orderNumber}`).click();
    await expect(page.locator('text=Status: Shipped')).toBeVisible();
  });

  test('staff can process multiple items in single order', async ({ page }) => {
    await loginViaUI(page, 'staffSales');
    await page.goto('/dashboard/pos');
    
    // Add multiple products
    await page.fill('input[placeholder*="Search"]', 'T-Shirt');
    await page.locator('button:text("Add")').first().click();
    
    await page.fill('input[placeholder*="Search"]', 'Jeans');
    await page.locator('button:text("Add")').first().click();
    
    // Verify both items in cart
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
    await expect(page.locator('text=Designer Jeans')).toBeVisible();
    
    // Calculate expected total
    const tshirtPrice = 29.99;
    const jeansPrice = 79.99;
    const subtotal = tshirtPrice + jeansPrice;
    
    await expect(page.locator(`text=${subtotal.toFixed(2)}`)).toBeVisible();
    
    // Complete order
    await page.click('button:text("Complete Payment")');
    await page.click('button:text("Cash")');
    
    await expect(page.locator('text=Order created')).toBeVisible();
  });

  test('staff can apply discount to POS order', async ({ page }) => {
    await loginViaUI(page, 'staffSales');
    await page.goto('/dashboard/pos');
    
    // Add product
    await page.fill('input[placeholder*="Search"]', 'Premium T-Shirt');
    await page.locator('button:text("Add")').first().click();
    
    // Apply discount
    await page.click('button:text("Apply Discount")');
    await page.fill('input[placeholder*="Percentage"]', '10');
    await page.click('button:text("Apply")');
    
    // Verify discount applied (29.99 - 10% = 26.99)
    await expect(page.locator('text=Discount: 3.00')).toBeVisible();
    await expect(page.locator('text=Total: 26.99')).toBeVisible();
  });

  test('inventory staff cannot access POS', async ({ page }) => {
    await loginViaUI(page, 'staffInventory');
    
    // Try to access POS
    await page.goto('/dashboard/pos');
    
    // Should redirect to unauthorized or show access denied
    await expect(page).toHaveURL(/unauthorized|dashboard/);
    
    // If on dashboard, POS link should not be visible
    if (page.url().includes('dashboard')) {
      await expect(page.locator('a:text("POS")')).not.toBeVisible();
    }
  });
});


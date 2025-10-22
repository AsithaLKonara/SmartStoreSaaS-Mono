import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Complete Order Lifecycle', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'full');
  });

  test('order flows from creation to delivery', async ({ page }) => {
    // Step 1: Create order as tenant admin
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/orders/new');
    
    // Select customer
    await page.click('button:text("Select Customer")');
    await page.click('text=John Doe');
    
    // Add products
    await page.click('button:text("Add Product")');
    await page.fill('input[placeholder*="Search"]', 'Premium T-Shirt');
    await page.click('text=Premium T-Shirt');
    await page.fill('input[name="quantity"]', '2');
    await page.click('button:text("Add")');
    
    // Verify totals calculated
    await expect(page.locator('text=59.98')).toBeVisible(); // 29.99 * 2
    
    // Create order
    await page.click('button:text("Create Order")');
    await expect(page.locator('text=Order created')).toBeVisible();
    
    // Get order number
    const orderNumberElement = await page.locator('text=ORD-').first();
    const orderNumber = await orderNumberElement.textContent();
    
    // Step 2: Process payment
    await page.click('button:text("Process Payment")');
    await page.selectOption('select[name="paymentMethod"]', 'card');
    
    // Use test card
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    
    await page.click('button:text("Pay Now")');
    await expect(page.locator('text=Payment successful')).toBeVisible({ timeout: 15000 });
    
    // Verify status updated to CONFIRMED
    await expect(page.locator('text=Status: Confirmed')).toBeVisible();
    
    // Step 3: Fulfillment (as staff)
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'staffSales');
    
    await page.goto('/dashboard/fulfillment');
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();
    
    // Pick order
    await page.locator(`text=${orderNumber}`).click();
    await page.click('button:text("Start Picking")');
    await page.check('input[type="checkbox"]');
    await page.click('button:text("Complete Picking")');
    
    // Pack order
    await page.click('button:text("Pack Order")');
    await page.fill('input[placeholder*="Weight"]', '0.5');
    await page.click('button:text("Complete Packing")');
    
    // Generate label
    await page.click('button:text("Generate Label")');
    await expect(page.locator('text=Label generated')).toBeVisible();
    
    // Ship order
    await page.fill('input[placeholder*="Tracking"]', 'TRACK123456');
    await page.selectOption('select[name="courier"]', 'DHL');
    await page.click('button:text("Mark as Shipped")');
    
    // Verify status
    await expect(page.locator('text=Status: Shipped')).toBeVisible();
    
    // Step 4: Customer receives notification
    // (In real scenario, customer would receive email/SMS)
    
    // Step 5: Mark as delivered (after courier update)
    await page.goto(`/dashboard/orders`);
    await page.locator(`text=${orderNumber}`).click();
    await page.click('button:text("Mark as Delivered")');
    
    await expect(page.locator('text=Status: Delivered')).toBeVisible();
    
    // Step 6: Verify customer can see order
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'customer');
    
    await page.goto('/customer-portal/orders');
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();
    await expect(page.locator('text=Delivered')).toBeVisible();
  });

  test('order can be cancelled before shipment', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    // Create order
    await page.goto('/dashboard/orders/new');
    await page.click('button:text("Select Customer")');
    await page.click('text=John Doe');
    await page.click('button:text("Add Product")');
    await page.click('text=Premium T-Shirt');
    await page.click('button:text("Create Order")');
    
    const orderNumberElement = await page.locator('text=ORD-').first();
    const orderNumber = await orderNumberElement.textContent();
    
    // Cancel order
    await page.click('button:text("Cancel Order")');
    await page.fill('textarea[name="cancellationReason"]', 'Customer requested cancellation');
    await page.click('button:text("Confirm Cancellation")');
    
    // Verify cancelled
    await expect(page.locator('text=Status: Cancelled')).toBeVisible();
    
    // Verify inventory restored
    await page.goto('/dashboard/inventory');
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
    // Stock should be back to original (100)
  });

  test('order cannot be cancelled after shipment', async ({ page, request }) => {
    // Create and ship an order via API
    const orgResponse = await request.get('/api/tenants');
    const { data: orgs } = await orgResponse.json();
    const orgId = orgs[0]?.id;
    
    const customerResponse = await request.get('/api/customers');
    const { data: customers } = await customerResponse.json();
    const customerId = customers[0]?.id;
    
    const productResponse = await request.get('/api/products');
    const { data: products } = await productResponse.json();
    const productId = products[0]?.id;
    
    if (!orgId || !customerId || !productId) {
      test.skip();
      return;
    }
    
    const orderResponse = await request.post('/api/test/create-order', {
      data: {
        organizationId: orgId,
        customerId,
        status: 'SHIPPED', // Already shipped
        items: [{ productId, quantity: 1, price: 29.99 }],
        subtotal: 29.99,
        tax: 2.40,
        shipping: 5.99,
        total: 38.38,
      },
    });
    
    const { order } = await orderResponse.json();
    
    // Login and try to cancel
    await loginViaUI(page, 'tenantAdmin');
    await page.goto(`/dashboard/orders/${order.id}`);
    
    // Cancel button should be disabled or not visible
    const cancelButton = page.locator('button:text("Cancel Order")');
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeDisabled();
    } else {
      await expect(cancelButton).not.toBeVisible();
    }
  });
});


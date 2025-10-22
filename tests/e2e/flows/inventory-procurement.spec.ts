import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Inventory and Procurement Workflow', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'full');
  });

  test('inventory manager can create purchase order for low stock', async ({ page }) => {
    // Login as inventory manager
    await loginViaUI(page, 'staffInventory');
    
    // Step 1: Check inventory levels
    await page.goto('/dashboard/inventory');
    await expect(page.locator('text=Inventory')).toBeVisible();
    
    // Find low stock product
    await page.locator('[data-stock-status="low"]').first().click();
    
    // Step 2: Create purchase order
    await page.click('button:text("Create Purchase Order")');
    
    // Modal or new page opens
    await page.fill('input[name="quantity"]', '100');
    
    // Select supplier
    await page.click('button:text("Select Supplier")');
    await page.click('text=ABC Suppliers Ltd');
    
    // Set expected delivery date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    await page.fill('input[name="expectedDate"]', futureDate.toISOString().split('T')[0]);
    
    // Add notes
    await page.fill('textarea[name="notes"]', 'Urgent restock for low inventory');
    
    // Create PO
    await page.click('button:text("Create PO")');
    
    // Verify PO created
    await expect(page.locator('text=Purchase order created')).toBeVisible();
    await expect(page.locator('text=PO-')).toBeVisible();
    
    const poNumber = await page.locator('text=PO-').first().textContent();
    
    // Step 3: Submit for approval (if required)
    await page.click('button:text("Submit for Approval")');
    await expect(page.locator('text=Status: Submitted')).toBeVisible();
    
    // Step 4: Admin approves
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/procurement/purchase-orders');
    await page.locator(`text=${poNumber}`).click();
    
    await page.click('button:text("Approve")');
    await expect(page.locator('text=Status: Approved')).toBeVisible();
    
    // Step 5: Receive items (back to inventory manager)
    await page.goto('/api/auth/signout');
    await loginViaUI(page, 'staffInventory');
    
    await page.goto('/dashboard/procurement/purchase-orders');
    await page.locator(`text=${poNumber}`).click();
    
    await page.click('button:text("Receive Items")');
    
    // Enter received quantities
    await page.fill('input[name="receivedQuantity"]', '100');
    await page.click('button:text("Confirm Receipt")');
    
    // Verify PO completed
    await expect(page.locator('text=Status: Received')).toBeVisible();
    
    // Step 6: Verify inventory updated
    await page.goto('/dashboard/inventory');
    
    // Stock should be updated
    await expect(page.locator('[data-stock]')).toContainText('100');
  });

  test('inventory manager can transfer stock between warehouses', async ({ page }) => {
    await loginViaUI(page, 'staffInventory');
    
    await page.goto('/dashboard/warehouse');
    
    // Select product to transfer
    await page.fill('input[placeholder*="Search"]', 'Premium T-Shirt');
    await page.click('text=Premium T-Shirt');
    
    // Click transfer button
    await page.click('button:text("Transfer Stock")');
    
    // Select from/to warehouses
    await page.selectOption('select[name="fromWarehouse"]', 'Main Warehouse');
    await page.selectOption('select[name="toWarehouse"]', 'Regional Warehouse');
    
    // Enter quantity
    await page.fill('input[name="quantity"]', '50');
    await page.fill('textarea[name="reason"]', 'Rebalancing inventory');
    
    // Confirm transfer
    await page.click('button:text("Transfer")');
    
    // Verify transfer created
    await expect(page.locator('text=Transfer created')).toBeVisible();
    
    // Verify warehouse stock updated
    await page.goto('/dashboard/warehouse');
    
    // Main warehouse should show reduced stock
    await expect(page.locator('[data-warehouse="main"]')).toContainText('50');
    
    // Regional warehouse should show increased stock
    await expect(page.locator('[data-warehouse="regional"]')).toContainText('50');
  });

  test('low stock alert triggers notification', async ({ page }) => {
    await loginViaUI(page, 'staffInventory');
    
    await page.goto('/dashboard/inventory');
    
    // Create stock adjustment that triggers low stock
    await page.locator('[data-product-sku="TSHIRT-001"]').click();
    
    await page.click('button:text("Adjust Stock")');
    await page.selectOption('select[name="adjustmentType"]', 'decrease');
    await page.fill('input[name="quantity"]', '85'); // Reduce from 100 to 15 (below minStock of 20)
    await page.fill('textarea[name="reason"]', 'Inventory count correction');
    await page.click('button:text("Confirm Adjustment")');
    
    // Verify low stock indicator appears
    await expect(page.locator('[data-stock-status="low"]')).toBeVisible();
    
    // Check notification center
    await page.click('button[aria-label="Notifications"]');
    await expect(page.locator('text=Low stock alert')).toBeVisible();
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
  });

  test('admin can export inventory report', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/inventory');
    
    // Click export button
    await page.click('button:text("Export")');
    
    // Select export format
    await page.selectOption('select[name="format"]', 'csv');
    
    // Select what to export
    await page.check('input[name="includeVariants"]');
    await page.check('input[name="includeValuation"]');
    
    // Download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:text("Download")'),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('inventory');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('inventory valuation report shows correct totals', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/inventory');
    
    // View inventory value
    await page.click('button:text("View Valuation")');
    
    // Should show total inventory value
    await expect(page.locator('text=Total Inventory Value')).toBeVisible();
    await expect(page.locator('[data-total-value]')).toBeVisible();
    
    // Should break down by category/warehouse
    await expect(page.locator('text=By Category')).toBeVisible();
    await expect(page.locator('text=By Warehouse')).toBeVisible();
    
    // Should show cost vs retail value
    await expect(page.locator('text=Cost Value')).toBeVisible();
    await expect(page.locator('text=Retail Value')).toBeVisible();
  });
});


import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'basic');
  });

  test('admin can create product with variants', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    // Navigate to products
    await page.goto('/dashboard/products');
    await expect(page.locator('text=Products')).toBeVisible();
    
    // Click add product
    await page.click('button:text("Add Product")');
    await page.waitForURL(/\/products\/new/);
    
    // Fill product details
    await page.fill('input[name="name"]', 'Test E2E Product');
    await page.fill('input[name="sku"]', 'E2E-TEST-001');
    await page.fill('textarea[name="description"]', 'This is a test product created by E2E test');
    await page.fill('input[name="price"]', '49.99');
    await page.fill('input[name="cost"]', '25.00');
    await page.fill('input[name="stock"]', '100');
    await page.fill('input[name="minStock"]', '20');
    
    // Add variants
    await page.click('button:text("Add Variant")');
    await page.fill('input[name="variants[0].name"]', 'Small - Blue');
    await page.fill('input[name="variants[0].sku"]', 'E2E-TEST-001-S-BLU');
    await page.fill('input[name="variants[0].price"]', '49.99');
    await page.fill('input[name="variants[0].stock"]', '50');
    
    await page.click('button:text("Add Variant")');
    await page.fill('input[name="variants[1].name"]', 'Large - Red');
    await page.fill('input[name="variants[1].sku"]', 'E2E-TEST-001-L-RED');
    await page.fill('input[name="variants[1].price"]', '54.99');
    await page.fill('input[name="variants[1].stock"]', '50');
    
    // Save product
    await page.click('button:text("Publish")');
    
    // Verify redirect to product list
    await page.waitForURL(/\/products$/);
    await expect(page.locator('text=Test E2E Product')).toBeVisible();
    
    // Click to view product details
    await page.locator('text=Test E2E Product').click();
    
    // Verify variants are shown
    await expect(page.locator('text=Small - Blue')).toBeVisible();
    await expect(page.locator('text=Large - Red')).toBeVisible();
  });

  test('admin can update product price and stock', async ({ page, request }) => {
    await seedDatabase(request, 'products');
    await loginViaUI(page, 'tenantAdmin');
    
    // Navigate to products
    await page.goto('/dashboard/products');
    
    // Find and edit existing product
    await page.locator('text=Premium T-Shirt').click();
    
    // Update price
    await page.fill('input[name="price"]', '34.99'); // was 29.99
    
    // Update stock
    await page.fill('input[name="stock"]', '150'); // was 100
    
    // Save changes
    await page.click('button:text("Save")');
    
    // Verify success message
    await expect(page.locator('text=Product updated')).toBeVisible();
    
    // Verify changes persisted
    await page.reload();
    await expect(page.locator('input[name="price"]')).toHaveValue('34.99');
    await expect(page.locator('input[name="stock"]')).toHaveValue('150');
  });

  test('admin can deactivate product', async ({ page, request }) => {
    await seedDatabase(request, 'products');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/products');
    await page.locator('text=Premium T-Shirt').click();
    
    // Deactivate product
    await page.click('button:text("Deactivate")');
    await page.click('button:text("Confirm")');
    
    // Verify product is inactive
    await expect(page.locator('text=Inactive')).toBeVisible();
    
    // Go back to product list
    await page.goto('/dashboard/products');
    
    // Product should not appear in active products
    const activeFilter = page.locator('select[name="filter"]');
    await activeFilter.selectOption('active');
    
    await expect(page.locator('text=Premium T-Shirt')).not.toBeVisible();
    
    // Show inactive products
    await activeFilter.selectOption('inactive');
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
  });

  test('admin can search and filter products', async ({ page, request }) => {
    await seedDatabase(request, 'products');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/products');
    
    // Test search
    await page.fill('input[placeholder*="Search"]', 'T-Shirt');
    await page.waitForTimeout(500); // Wait for debounce
    
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
    await expect(page.locator('text=Designer Jeans')).not.toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(500);
    
    // Test price filter
    await page.fill('input[name="minPrice"]', '50');
    await page.waitForTimeout(500);
    
    // Only products >= $50 should show
    await expect(page.locator('text=Designer Jeans')).toBeVisible(); // $79.99
    await expect(page.locator('text=Running Shoes')).toBeVisible(); // $89.99
    await expect(page.locator('text=Premium T-Shirt')).not.toBeVisible(); // $29.99
  });

  test('admin can bulk update product prices', async ({ page, request }) => {
    await seedDatabase(request, 'products');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/products');
    
    // Select multiple products
    await page.check('input[type="checkbox"][data-product-sku="TSHIRT-001"]');
    await page.check('input[type="checkbox"][data-product-sku="JEANS-001"]');
    
    // Click bulk actions
    await page.click('button:text("Bulk Actions")');
    await page.click('text=Update Prices');
    
    // Apply percentage increase
    await page.fill('input[name="adjustment"]', '10'); // 10% increase
    await page.selectOption('select[name="adjustmentType"]', 'percentage');
    await page.click('button:text("Apply")');
    
    // Verify confirmation
    await expect(page.locator('text=2 products updated')).toBeVisible();
    
    // Verify price changes
    await page.locator('text=Premium T-Shirt').click();
    await expect(page.locator('input[name="price"]')).toHaveValue('32.99'); // 29.99 * 1.1
  });

  test('product SKU must be unique', async ({ page, request }) => {
    await seedDatabase(request, 'products');
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/products/new');
    
    // Try to create product with existing SKU
    await page.fill('input[name="name"]', 'Duplicate SKU Product');
    await page.fill('input[name="sku"]', 'TSHIRT-001'); // Already exists
    await page.fill('input[name="price"]', '29.99');
    await page.fill('input[name="stock"]', '100');
    await page.fill('input[name="minStock"]', '10');
    
    await page.click('button:text("Publish")');
    
    // Should show error
    await expect(page.locator('text=SKU already exists')).toBeVisible();
  });

  test('staff with inventory role can update stock but not price', async ({ page, request }) => {
    await seedDatabase(request, 'products');
    await loginViaUI(page, 'staffInventory');
    
    await page.goto('/dashboard/products');
    await page.locator('text=Premium T-Shirt').click();
    
    // Stock field should be editable
    await expect(page.locator('input[name="stock"]')).toBeEditable();
    
    // Price field should be disabled or not visible
    const priceInput = page.locator('input[name="price"]');
    if (await priceInput.isVisible()) {
      await expect(priceInput).toBeDisabled();
    }
    
    // Can update stock
    await page.fill('input[name="stock"]', '200');
    await page.click('button:text("Save")');
    
    await expect(page.locator('text=Stock updated')).toBeVisible();
  });
});


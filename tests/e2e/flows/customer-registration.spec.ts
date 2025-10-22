import { test, expect } from '@playwright/test';
import { generateVerificationToken, resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Customer Registration and First Purchase', () => {
  test.beforeEach(async ({ request }) => {
    // Reset and seed database with basic data
    await resetDatabase(request);
    await seedDatabase(request, 'products');
  });

  test('customer can register, verify, login, and make first purchase', async ({ page, request }) => {
    const testEmail = `testuser+${Date.now()}@smartstore.test`;
    
    // Step 1: Navigate to registration page
    await page.goto('/');
    await page.click('text=Get Started');
    
    // Step 2: Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.click('button[type="submit"]');
    
    // Step 3: Verify email (simulate via test API)
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 10000 });
    
    const token = await generateVerificationToken(request, testEmail);
    await page.goto(`/verify?token=${token}`);
    await expect(page.locator('text=verified')).toBeVisible();
    
    // Step 4: Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to customer portal
    await page.waitForURL(/\/customer-portal/);
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Step 5: Browse products
    await page.goto('/portal/products');
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
    
    // Step 6: Add product to cart
    await page.locator('text=Premium T-Shirt').first().click();
    await page.click('button:text("Add to Cart")');
    await expect(page.locator('text=Added to cart')).toBeVisible();
    
    // Step 7: View cart
    await page.goto('/portal/cart');
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
    await expect(page.locator('text=29.99')).toBeVisible();
    
    // Step 8: Proceed to checkout
    await page.click('button:text("Checkout")');
    await page.fill('input[name="address"]', '123 Test Street, Colombo');
    await page.fill('input[name="phone"]', '+94771234567');
    
    // Step 9: Complete payment (sandbox mode)
    await page.click('button:text("Complete Payment")');
    
    // Step 10: Verify order confirmation
    await expect(page.locator('text=Order confirmed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Order #')).toBeVisible();
    
    // Step 11: Verify order appears in customer portal
    await page.goto('/customer-portal/orders');
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
  });

  test('registration validates password requirements', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak'); // Too weak
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Password must')).toBeVisible();
  });

  test('registration prevents duplicate email', async ({ page, request }) => {
    await seedDatabase(request, 'customers');
    
    await page.goto('/register');
    
    // Try to register with existing email
    await page.fill('input[name="email"]', 'customer+test@smartstore.test');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('text=already exists')).toBeVisible();
  });
});


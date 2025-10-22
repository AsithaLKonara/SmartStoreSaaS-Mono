import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('RBAC Permissions', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'full');
  });

  test('super admin can access all pages', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    
    // Check super admin pages are accessible
    await page.goto('/dashboard/tenants');
    await expect(page.locator('text=Organizations')).toBeVisible();
    
    await page.goto('/dashboard/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    await page.goto('/dashboard/monitoring');
    await expect(page).toHaveURL(/\/monitoring/);
    
    await page.goto('/dashboard/backup');
    await expect(page).toHaveURL(/\/backup/);
  });

  test('tenant admin can access organization features', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    // Can access main features
    await page.goto('/dashboard/products');
    await expect(page.locator('text=Products')).toBeVisible();
    
    await page.goto('/dashboard/orders');
    await expect(page.locator('text=Orders')).toBeVisible();
    
    await page.goto('/dashboard/users');
    await expect(page.locator('text=User Management')).toBeVisible();
    
    // Cannot access super admin pages
    await page.goto('/dashboard/tenants');
    await expect(page).not.toHaveURL(/\/tenants/);
    
    await page.goto('/dashboard/admin');
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('sales staff can access POS and orders only', async ({ page }) => {
    await loginViaUI(page, 'staffSales');
    
    // Can access POS
    await page.goto('/dashboard/pos');
    await expect(page.locator('text=Point of Sale')).toBeVisible();
    
    // Can access orders
    await page.goto('/dashboard/orders');
    await expect(page.locator('text=Orders')).toBeVisible();
    
    // Can access customers
    await page.goto('/dashboard/customers');
    await expect(page.locator('text=Customers')).toBeVisible();
    
    // Cannot access products management
    await page.goto('/dashboard/products/new');
    await expect(page).not.toHaveURL(/\/products\/new/);
    
    // Cannot access settings
    await page.goto('/dashboard/settings');
    await expect(page).not.toHaveURL(/\/settings/);
    
    // Cannot access users
    await page.goto('/dashboard/users');
    await expect(page).not.toHaveURL(/\/users/);
  });

  test('inventory staff can manage inventory but not prices', async ({ page }) => {
    await loginViaUI(page, 'staffInventory');
    
    // Can access inventory
    await page.goto('/dashboard/inventory');
    await expect(page.locator('text=Inventory')).toBeVisible();
    
    // Can access warehouse
    await page.goto('/dashboard/warehouse');
    await expect(page.locator('text=Warehouse')).toBeVisible();
    
    // Can view products
    await page.goto('/dashboard/products');
    await expect(page.locator('text=Products')).toBeVisible();
    
    // Cannot access POS
    await page.goto('/dashboard/pos');
    await expect(page).not.toHaveURL(/\/pos/);
    
    // Cannot access orders
    await page.goto('/dashboard/orders/new');
    await expect(page).not.toHaveURL(/\/orders\/new/);
  });

  test('customer can only access customer portal', async ({ page }) => {
    await loginViaUI(page, 'customer');
    
    // Should redirect to customer portal
    await expect(page).toHaveURL(/\/customer-portal/);
    
    // Can access portal pages
    await page.goto('/customer-portal/orders');
    await expect(page.locator('text=My Orders')).toBeVisible();
    
    await page.goto('/customer-portal/account');
    await expect(page.locator('text=My Account')).toBeVisible();
    
    // Cannot access dashboard
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard/);
    
    await page.goto('/dashboard/products');
    await expect(page).not.toHaveURL(/\/products/);
  });

  test('tenant admin can create and assign staff roles', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/users');
    await page.click('button:text("Add User")');
    
    // Fill user details
    await page.fill('input[name="email"]', 'newstaff@test.com');
    await page.fill('input[name="name"]', 'New Staff Member');
    await page.fill('input[name="password"]', 'StaffPass123!');
    
    // Select role
    await page.selectOption('select[name="role"]', 'STAFF');
    await page.selectOption('select[name="roleTag"]', 'sales_staff');
    
    // Save
    await page.click('button:text("Create User")');
    
    // Verify user created
    await expect(page.locator('text=User created')).toBeVisible();
    await expect(page.locator('text=newstaff@test.com')).toBeVisible();
  });

  test('staff cannot create other users', async ({ page }) => {
    await loginViaUI(page, 'staffSales');
    
    await page.goto('/dashboard/users');
    
    // Should not see user management or button
    const addButton = page.locator('button:text("Add User")');
    await expect(addButton).not.toBeVisible();
  });

  test('permissions prevent unauthorized API access', async ({ request }) => {
    // Login as sales staff
    const response = await request.post('/api/auth/signin', {
      data: {
        email: 'staff.sales+test@smartstore.test',
        password: 'StaffSales123!',
      },
    });
    
    const { token } = await response.json();
    
    // Try to access admin-only API endpoint
    const adminResponse = await request.get('/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Should be forbidden
    expect(adminResponse.status()).toBe(403);
  });

  test('super admin can impersonate organizations', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    
    await page.goto('/dashboard/tenants');
    
    // Find organization and impersonate
    await page.locator('button[aria-label="Actions"]').first().click();
    await page.click('text=Impersonate');
    
    // Should switch context
    await expect(page.locator('text=Impersonating')).toBeVisible();
    
    // Can now see that organization's data
    await page.goto('/dashboard/products');
    
    // Stop impersonating
    await page.click('button:text("Stop Impersonating")');
    await expect(page.locator('text=Impersonating')).not.toBeVisible();
  });

  test('role-based navigation menu visibility', async ({ page }) => {
    // Tenant Admin - full menu
    await loginViaUI(page, 'tenantAdmin');
    await expect(page.locator('nav a:text("Products")')).toBeVisible();
    await expect(page.locator('nav a:text("Orders")')).toBeVisible();
    await expect(page.locator('nav a:text("Users")')).toBeVisible();
    await expect(page.locator('nav a:text("Settings")')).toBeVisible();
    await expect(page.locator('nav a:text("Organizations")')).not.toBeVisible();
    
    // Logout
    await page.goto('/api/auth/signout');
    
    // Sales Staff - limited menu
    await loginViaUI(page, 'staffSales');
    await expect(page.locator('nav a:text("POS")')).toBeVisible();
    await expect(page.locator('nav a:text("Orders")')).toBeVisible();
    await expect(page.locator('nav a:text("Users")')).not.toBeVisible();
    await expect(page.locator('nav a:text("Settings")')).not.toBeVisible();
  });
});


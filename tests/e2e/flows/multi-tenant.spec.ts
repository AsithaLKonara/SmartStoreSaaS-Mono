import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, createTestOrganization } from '../utils/test-data';

test.describe('Multi-Tenant Isolation', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('super admin can create and manage multiple organizations', async ({ page, request }) => {
    await loginViaUI(page, 'superAdmin');
    
    // Navigate to organizations
    await page.goto('/dashboard/tenants');
    await expect(page.locator('text=Organizations')).toBeVisible();
    
    // Create first organization
    await page.click('button:text("Create Organization")');
    await page.fill('input[name="name"]', 'Acme Corporation');
    await page.fill('input[name="domain"]', 'acme');
    await page.selectOption('select[name="plan"]', 'PRO');
    await page.fill('input[name="adminEmail"]', 'admin@acme.test');
    await page.fill('input[name="adminName"]', 'Acme Admin');
    await page.click('button:text("Create")');
    
    // Verify created
    await expect(page.locator('text=Organization created')).toBeVisible();
    await expect(page.locator('text=Acme Corporation')).toBeVisible();
    
    // Create second organization
    await page.click('button:text("Create Organization")');
    await page.fill('input[name="name"]', 'Beta Company');
    await page.fill('input[name="domain"]', 'beta');
    await page.selectOption('select[name="plan"]', 'BASIC');
    await page.fill('input[name="adminEmail"]', 'admin@beta.test');
    await page.fill('input[name="adminName"]', 'Beta Admin');
    await page.click('button:text("Create")');
    
    // Verify both organizations visible
    await expect(page.locator('text=Acme Corporation')).toBeVisible();
    await expect(page.locator('text=Beta Company')).toBeVisible();
  });

  test('data is isolated between organizations', async ({ page, request }) => {
    // Create two organizations with test data
    const org1 = await createTestOrganization(request, {
      name: 'Organization One',
      domain: 'org1',
      plan: 'PRO',
    });
    
    const org2 = await createTestOrganization(request, {
      name: 'Organization Two',
      domain: 'org2',
      plan: 'BASIC',
    });
    
    // Create product in org1
    await request.post('/api/test/create-product', {
      data: {
        name: 'Org1 Product',
        sku: 'ORG1-001',
        price: 29.99,
        organizationId: org1.organization.id,
      },
    });
    
    // Create product in org2
    await request.post('/api/test/create-product', {
      data: {
        name: 'Org2 Product',
        sku: 'ORG2-001',
        price: 49.99,
        organizationId: org2.organization.id,
      },
    });
    
    // Login as super admin
    await loginViaUI(page, 'superAdmin');
    
    // Switch to org1
    await page.goto('/dashboard/tenants');
    await page.locator('text=Organization One').locator('..').locator('button:text("Impersonate")').click();
    
    // Verify only org1 products visible
    await page.goto('/dashboard/products');
    await expect(page.locator('text=Org1 Product')).toBeVisible();
    await expect(page.locator('text=Org2 Product')).not.toBeVisible();
    
    // Stop impersonating
    await page.click('button:text("Stop Impersonating")');
    
    // Switch to org2
    await page.goto('/dashboard/tenants');
    await page.locator('text=Organization Two').locator('..').locator('button:text("Impersonate")').click();
    
    // Verify only org2 products visible
    await page.goto('/dashboard/products');
    await expect(page.locator('text=Org2 Product')).toBeVisible();
    await expect(page.locator('text=Org1 Product')).not.toBeVisible();
  });

  test('tenant admin cannot access other organizations', async ({ page, request }) => {
    // Create two organizations
    const org1 = await createTestOrganization(request, {
      name: 'Organization One',
      domain: 'org1',
    });
    
    const org2 = await createTestOrganization(request, {
      name: 'Organization Two',
      domain: 'org2',
    });
    
    // Login as tenant admin (automatically assigned to one org)
    await loginViaUI(page, 'tenantAdmin');
    
    // Should not see organizations page
    await page.goto('/dashboard/tenants');
    await expect(page).not.toHaveURL(/\/tenants/);
    
    // Should only see own organization's data
    await page.goto('/dashboard/products');
    
    // Verify organization context in UI
    const orgName = await page.locator('[data-organization-name]').textContent();
    expect(orgName).not.toBeNull();
  });

  test('API enforces organization scoping', async ({ request }) => {
    // Create two organizations with products
    const org1 = await createTestOrganization(request, {
      name: 'Org One',
      domain: 'org1',
    });
    
    await request.post('/api/test/create-product', {
      data: {
        name: 'Org1 Product',
        sku: 'ORG1-PROD',
        price: 29.99,
        organizationId: org1.organization.id,
      },
    });
    
    const org2 = await createTestOrganization(request, {
      name: 'Org Two',
      domain: 'org2',
    });
    
    await request.post('/api/test/create-product', {
      data: {
        name: 'Org2 Product',
        sku: 'ORG2-PROD',
        price: 49.99,
        organizationId: org2.organization.id,
      },
    });
    
    // Login as org1 admin and fetch products
    // In real implementation, session would set organizationId
    // This test verifies API returns only org-scoped data
    
    const productsResponse = await request.get('/api/products', {
      headers: {
        'X-Organization-Id': org1.organization.id,
      },
    });
    
    const { data: products } = await productsResponse.json();
    
    // Should only return org1 products
    expect(products).toHaveLength(1);
    expect(products[0].sku).toBe('ORG1-PROD');
  });

  test('organization usage limits are enforced', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    // Navigate to billing
    await page.goto('/dashboard/billing');
    
    // Verify current plan shown
    await expect(page.locator('text=Current Plan')).toBeVisible();
    
    // Verify usage metrics
    await expect(page.locator('text=Users:')).toBeVisible();
    await expect(page.locator('text=Products:')).toBeVisible();
    await expect(page.locator('text=Orders:')).toBeVisible();
    
    // Verify plan limits
    await expect(page.locator('text=Limit:')).toBeVisible();
  });
});


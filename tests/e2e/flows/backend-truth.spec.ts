import { test, expect } from '../utils/test-base';
import { getAuthToken } from '../utils/auth';
import { resetDatabase, seedDatabase, createTestOrganization } from '../utils/test-data';

test.describe('Backend Truth Enforcement (RBAC & Tenant Isolation)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'full');
  });

  test('Tenant Isolation: Tenant A cannot fetch Tenant B orders', async ({ request }) => {
    // 1. Get token for tenant admin
    const token = await getAuthToken(request, 'tenantAdmin');

    // 2. Create another organization (Tenant B) and a product/order inside it
    const orgB = await createTestOrganization(request, {
      name: 'Tenant B',
      domain: 'tenantb'
    });

    // Create product in Org B
    const productBResponse = await request.post('/api/test/create-product', {
      data: {
        name: 'Tenant B Item',
        sku: 'TB-ITEM',
        price: 15.00,
        organizationId: orgB.organization.id,
      },
    });
    const productB = await productBResponse.json();

    // Create a customer in Org B
    const customerBResponse = await request.post('/api/customers', {
      headers: { 
        'X-Organization-Id': orgB.organization.id,
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: 'Customer B',
        email: 'customer.b@test.com',
        phone: '123456789'
      }
    });
    const { data: customerB } = await customerBResponse.json();

    // Create order in Org B
    const orderBResponse = await request.post('/api/test/create-order', {
      data: {
        customerId: customerB.id,
        organizationId: orgB.organization.id,
        items: [{ productId: productB.product.id, quantity: 1, price: 15.00 }]
      }
    });
    const orderB = await orderBResponse.json();

    // 3. Attempt to fetch Tenant B's order using Tenant A's token
    const response = await request.get(`/api/orders/${orderB.order.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 4. Verify backend strictly rejects the request (should be 403 or 404, not 200)
    expect(response.status()).toBeGreaterThanOrEqual(403);
  });

  test('RBAC Enforcement: Customer cannot delete products', async ({ request }) => {
    const customerToken = await getAuthToken(request, 'customer');

    // Create product via super admin or test API
    const org = await createTestOrganization(request, { name: 'Test Org' });
    const productResponse = await request.post('/api/test/create-product', {
      data: {
        name: 'Vulnerable Product',
        sku: 'VULN-001',
        price: 9.99,
        organizationId: org.organization.id
      }
    });
    const product = await productResponse.json();

    // Attempt to delete product as a customer
    const deleteResponse = await request.delete(`/api/products/${product.product.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    // Verify rejection
    expect(deleteResponse.status()).toBe(403);
  });

  test('RBAC Enforcement: Customer cannot create products', async ({ request }) => {
    const customerToken = await getAuthToken(request, 'customer');

    // Attempt to create a product using Customer token
    const createResponse = await request.post('/api/products', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        name: 'Hacked Product',
        sku: 'HACK-123',
        price: 1.00
      }
    });

    // Verify rejection
    expect(createResponse.status()).toBe(403);
  });
});

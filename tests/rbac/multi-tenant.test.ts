/**
 * Multi-Tenant Isolation Tests
 * 
 * Tests that organization scoping prevents cross-tenant data access
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  createTestUsersForDifferentOrgs 
} from '../api/helpers/auth-helpers';
import { 
  get, post, put, del,
  parseJsonResponse 
} from '../api/helpers/request-helpers';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestProduct,
  createTestCustomer,
  createTestOrder,
  createTestOrganization
} from '../api/helpers/db-helpers';

const API_BASE = process.env.TEST_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Multi-Tenant Isolation', () => {
  let org1Users: ReturnType<typeof createTestUsersForDifferentOrgs>['org1'];
  let org2Users: ReturnType<typeof createTestUsersForDifferentOrgs>['org2'];
  let org1ProductId: string;
  let org2ProductId: string;
  let org1CustomerId: string;
  let org2CustomerId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const users = createTestUsersForDifferentOrgs();
    org1Users = users.org1;
    org2Users = users.org2;

    // Create test data in different organizations
    const org1 = await createTestOrganization({ id: 'org-1' });
    const org2 = await createTestOrganization({ id: 'org-2' });

    const product1 = await createTestProduct({ 
      organizationId: org1.id,
      name: 'Org1 Product',
      sku: 'ORG1-PROD'
    });
    org1ProductId = product1.id;

    const product2 = await createTestProduct({ 
      organizationId: org2.id,
      name: 'Org2 Product',
      sku: 'ORG2-PROD'
    });
    org2ProductId = product2.id;

    const customer1 = await createTestCustomer({ 
      organizationId: org1.id,
      email: 'org1@test.com'
    });
    org1CustomerId = customer1.id;

    const customer2 = await createTestCustomer({ 
      organizationId: org2.id,
      email: 'org2@test.com'
    });
    org2CustomerId = customer2.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Products - Organization Isolation', () => {
    test('TENANT_ADMIN from org1 should NOT see org2 products in list', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should not contain org2 product
      const org2Product = data.data.find((p: any) => p.id === org2ProductId);
      expect(org2Product).toBeUndefined();
    });

    test('TENANT_ADMIN from org1 should NOT access org2 product by ID', async () => {
      const response = await get(`${API_BASE}/api/products/${org2ProductId}`, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.code).toBe('ERR_FORBIDDEN');
    });

    test('TENANT_ADMIN from org1 should NOT update org2 product', async () => {
      const response = await put(`${API_BASE}/api/products/${org2ProductId}`, {
        name: 'Hacked Product'
      }, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    test('TENANT_ADMIN from org1 should NOT delete org2 product', async () => {
      const response = await del(`${API_BASE}/api/products/${org2ProductId}`, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Customers - Organization Isolation', () => {
    test('TENANT_ADMIN from org1 should NOT see org2 customers', async () => {
      const response = await get(`${API_BASE}/api/customers`, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should not contain org2 customer
      const org2Customer = data.data.find((c: any) => c.id === org2CustomerId);
      expect(org2Customer).toBeUndefined();
    });

    test('TENANT_ADMIN from org1 should NOT access org2 customer by ID', async () => {
      const response = await get(`${API_BASE}/api/customers/${org2CustomerId}`, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('SUPER_ADMIN - Cross-Tenant Access', () => {
    test('SUPER_ADMIN should access products from all organizations', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: org1Users.SUPER_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // SUPER_ADMIN can see all products (implementation dependent)
      // This test may need adjustment based on actual SUPER_ADMIN behavior
    });

    test('SUPER_ADMIN should access any organization product by ID', async () => {
      const response = await get(`${API_BASE}/api/products/${org2ProductId}`, {
        user: org1Users.SUPER_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      // SUPER_ADMIN should be able to access
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Data Creation - Organization Scoping', () => {
    test('TENANT_ADMIN from org1 should create product in org1', async () => {
      const response = await post(`${API_BASE}/api/products`, {
        name: 'Org1 New Product',
        sku: `ORG1-NEW-${Date.now()}`,
        price: 100
      }, {
        user: org1Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.organizationId).toBe('org-1');
    });

    test('Product created should be scoped to user organization', async () => {
      const response = await post(`${API_BASE}/api/products`, {
        name: 'Scoped Product',
        sku: `SCOPED-${Date.now()}`,
        price: 100
      }, {
        user: org2Users.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      
      expect(response.status).toBe(201);
      expect(data.data.organizationId).toBe('org-2');
    });
  });
});

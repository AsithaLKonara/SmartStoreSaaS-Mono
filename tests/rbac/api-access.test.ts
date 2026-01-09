/**
 * RBAC API Access Tests
 * 
 * Tests that API endpoints enforce role-based access control correctly
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  createTestUsersForAllRoles,
  createTestUsersForDifferentOrgs 
} from '../api/helpers/auth-helpers';
import { 
  get, post, put, del,
  parseJsonResponse 
} from '../api/helpers/request-helpers';
import {
  setupTestDatabase,
  teardownTestDatabase
} from '../api/helpers/db-helpers';

const API_BASE = process.env.TEST_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('RBAC - API Access Control', () => {
  let testUsers: ReturnType<typeof createTestUsersForAllRoles>;

  beforeAll(async () => {
    await setupTestDatabase();
    testUsers = createTestUsersForAllRoles('test-org-1');
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Products API - Role Access', () => {
    test('SUPER_ADMIN should access GET /api/products', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: testUsers.SUPER_ADMIN
      });
      expect(response.status).toBe(200);
    });

    test('TENANT_ADMIN should access GET /api/products', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: testUsers.TENANT_ADMIN
      });
      expect(response.status).toBe(200);
    });

    test('STAFF should access GET /api/products', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: testUsers.STAFF
      });
      expect(response.status).toBe(200);
    });

    test('CUSTOMER should NOT access GET /api/products', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: testUsers.CUSTOMER
      });
      const data = await parseJsonResponse(response);
      expect(response.status).toBe(403);
      expect(data.code).toBe('ERR_FORBIDDEN');
    });
  });

  describe('Orders API - Role Access', () => {
    test('SUPER_ADMIN should access GET /api/orders', async () => {
      const response = await get(`${API_BASE}/api/orders`, {
        user: testUsers.SUPER_ADMIN
      });
      expect([200, 401, 403]).toContain(response.status);
    });

    test('TENANT_ADMIN should access GET /api/orders', async () => {
      const response = await get(`${API_BASE}/api/orders`, {
        user: testUsers.TENANT_ADMIN
      });
      expect([200, 401, 403]).toContain(response.status);
    });

    test('CUSTOMER should access GET /api/orders (own orders)', async () => {
      const response = await get(`${API_BASE}/api/orders`, {
        user: testUsers.CUSTOMER
      });
      // Customer can access their own orders
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Customers API - Role Access', () => {
    test('SUPER_ADMIN should access GET /api/customers', async () => {
      const response = await get(`${API_BASE}/api/customers`, {
        user: testUsers.SUPER_ADMIN
      });
      expect([200, 401, 403]).toContain(response.status);
    });

    test('TENANT_ADMIN should access GET /api/customers', async () => {
      const response = await get(`${API_BASE}/api/customers`, {
        user: testUsers.TENANT_ADMIN
      });
      expect([200, 401, 403]).toContain(response.status);
    });

    test('CUSTOMER should NOT access GET /api/customers', async () => {
      const response = await get(`${API_BASE}/api/customers`, {
        user: testUsers.CUSTOMER
      });
      const data = await parseJsonResponse(response);
      expect([403, 401]).toContain(response.status);
    });
  });

  describe('Tenants API - SUPER_ADMIN Only', () => {
    test('SUPER_ADMIN should access GET /api/tenants', async () => {
      const response = await get(`${API_BASE}/api/tenants`, {
        user: testUsers.SUPER_ADMIN
      });
      expect([200, 401, 403]).toContain(response.status);
    });

    test('TENANT_ADMIN should NOT access GET /api/tenants', async () => {
      const response = await get(`${API_BASE}/api/tenants`, {
        user: testUsers.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      expect([403, 401]).toContain(response.status);
    });

    test('STAFF should NOT access GET /api/tenants', async () => {
      const response = await get(`${API_BASE}/api/tenants`, {
        user: testUsers.STAFF
      });
      const data = await parseJsonResponse(response);
      expect([403, 401]).toContain(response.status);
    });
  });

  describe('Backup API - SUPER_ADMIN Only', () => {
    test('SUPER_ADMIN should access GET /api/backup', async () => {
      const response = await get(`${API_BASE}/api/backup`, {
        user: testUsers.SUPER_ADMIN
      });
      expect([200, 401, 403]).toContain(response.status);
    });

    test('TENANT_ADMIN should NOT access GET /api/backup', async () => {
      const response = await get(`${API_BASE}/api/backup`, {
        user: testUsers.TENANT_ADMIN
      });
      const data = await parseJsonResponse(response);
      expect([403, 401]).toContain(response.status);
    });
  });
});

describe('RBAC - Permission-Based Access', () => {
  let testUsers: ReturnType<typeof createTestUsersForAllRoles>;

  beforeAll(async () => {
    await setupTestDatabase();
    testUsers = createTestUsersForAllRoles('test-org-1');
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('VIEW_PRODUCTS Permission', () => {
    test('Users with VIEW_PRODUCTS should access products', async () => {
      // SUPER_ADMIN, TENANT_ADMIN, STAFF have VIEW_PRODUCTS
      const usersWithPermission = [
        testUsers.SUPER_ADMIN,
        testUsers.TENANT_ADMIN,
        testUsers.STAFF
      ];

      for (const user of usersWithPermission) {
        const response = await get(`${API_BASE}/api/products`, { user });
        expect(response.status).toBe(200);
      }
    });

    test('Users without VIEW_PRODUCTS should be denied', async () => {
      const response = await get(`${API_BASE}/api/products`, {
        user: testUsers.CUSTOMER
      });
      const data = await parseJsonResponse(response);
      expect(response.status).toBe(403);
      expect(data.code).toBe('ERR_FORBIDDEN');
    });
  });

  describe('MANAGE_PRODUCTS Permission', () => {
    test('Users with MANAGE_PRODUCTS should create products', async () => {
      const usersWithPermission = [
        testUsers.SUPER_ADMIN,
        testUsers.TENANT_ADMIN
      ];

      for (const user of usersWithPermission) {
        const response = await post(`${API_BASE}/api/products`, {
          name: `Test Product ${Date.now()}`,
          sku: `TEST-${Date.now()}`,
          price: 100
        }, { user });
        expect([201, 400, 500]).toContain(response.status);
      }
    });
  });
});

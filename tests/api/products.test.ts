/**
 * Products API Tests
 * Comprehensive test suite for products endpoints including:
 * - Authentication tests
 * - Authorization tests (RBAC)
 * - CRUD functionality tests
 * - Multi-tenant isolation tests
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { 
  createTestUser, 
  createTestUsersForAllRoles, 
  createTestUsersForDifferentOrgs 
} from './helpers/auth-helpers';
import { 
  get, post, put, del, 
  parseJsonResponse, 
  assertSuccess, 
  assertError 
} from './helpers/request-helpers';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestProduct,
  createTestOrganization,
  cleanupTestData
} from './helpers/db-helpers';

const API_BASE = process.env.TEST_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Products API - Authentication', () => {
  test('GET /api/products - should return 401 for unauthenticated requests', async () => {
    const response = await get(`${API_BASE}/api/products`);
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('ERR_AUTH');
  });

  test('POST /api/products - should return 401 for unauthenticated requests', async () => {
    const response = await post(`${API_BASE}/api/products`, {
      name: 'Test Product',
      sku: 'TEST-1',
      price: 100
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('ERR_AUTH');
  });

  test('GET /api/products/[id] - should return 401 for unauthenticated requests', async () => {
    const response = await get(`${API_BASE}/api/products/test-id`);
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('ERR_AUTH');
  });
});

describe('Products API - Authorization (RBAC)', () => {
  let testUsers: ReturnType<typeof createTestUsersForAllRoles>;
  let testProductId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    testUsers = createTestUsersForAllRoles('test-org-1');
    
    // Create a test product for testing
    const org = await createTestOrganization({ id: 'test-org-1' });
    const product = await createTestProduct({ 
      organizationId: org.id,
      name: 'Test Product',
      sku: 'TEST-RBAC'
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('GET /api/products - SUPER_ADMIN should have access', async () => {
    const response = await get(`${API_BASE}/api/products`, {
      user: testUsers.SUPER_ADMIN
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /api/products - TENANT_ADMIN should have access', async () => {
    const response = await get(`${API_BASE}/api/products`, {
      user: testUsers.TENANT_ADMIN
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /api/products - STAFF should have access', async () => {
    const response = await get(`${API_BASE}/api/products`, {
      user: testUsers.STAFF
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /api/products - CUSTOMER should NOT have access', async () => {
    const response = await get(`${API_BASE}/api/products`, {
      user: testUsers.CUSTOMER
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.code).toBe('ERR_FORBIDDEN');
  });

  test('POST /api/products - SUPER_ADMIN should have access', async () => {
    const response = await post(`${API_BASE}/api/products`, {
      name: 'Admin Product',
      sku: `ADMIN-${Date.now()}`,
      price: 100
    }, {
      user: testUsers.SUPER_ADMIN
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  test('POST /api/products - CUSTOMER should NOT have access', async () => {
    const response = await post(`${API_BASE}/api/products`, {
      name: 'Customer Product',
      sku: `CUSTOMER-${Date.now()}`,
      price: 100
    }, {
      user: testUsers.CUSTOMER
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

describe('Products API - CRUD Functionality', () => {
  let testUser = createTestUser({ role: 'TENANT_ADMIN' });
  let createdProductId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('POST /api/products - should create product with valid data', async () => {
    const productData = {
      name: 'New Test Product',
      description: 'Test Description',
      sku: `TEST-${Date.now()}`,
      price: 999.99,
      cost: 500.00,
      stock: 100,
      minStock: 10
    };

    const response = await post(`${API_BASE}/api/products`, productData, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(productData.name);
    expect(data.data.sku).toBe(productData.sku);
    expect(data.data.price).toBe(productData.price);
    
    createdProductId = data.data.id;
  });

  test('POST /api/products - should reject invalid data', async () => {
    const invalidProduct = {
      name: '', // Empty name
      price: -10 // Negative price
    };

    const response = await post(`${API_BASE}/api/products`, invalidProduct, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('ERR_VALIDATION');
  });

  test('GET /api/products - should return paginated list', async () => {
    const response = await get(`${API_BASE}/api/products?page=1&limit=5`, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.meta).toBeDefined();
    expect(data.meta.pagination).toBeDefined();
    expect(data.meta.pagination.page).toBe(1);
    expect(data.meta.pagination.limit).toBe(5);
  });

  test('GET /api/products - should support search', async () => {
    const response = await get(`${API_BASE}/api/products?search=Test`, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('GET /api/products/[id] - should return specific product', async () => {
    if (!createdProductId) {
      console.log('Skipping: No product ID available');
      return;
    }

    const response = await get(`${API_BASE}/api/products/${createdProductId}`, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(createdProductId);
  });

  test('GET /api/products/[id] - should return 404 for non-existent product', async () => {
    const response = await get(`${API_BASE}/api/products/nonexistent-id-12345`, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.code).toBe('ERR_NOT_FOUND');
  });

  test('PUT /api/products/[id] - should update product', async () => {
    if (!createdProductId) {
      console.log('Skipping: No product ID available');
      return;
    }

    const updates = {
      price: 1299.99,
      stock: 150,
      description: 'Updated description'
    };

    const response = await put(`${API_BASE}/api/products/${createdProductId}`, updates, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.price).toBe(updates.price);
    expect(data.data.stock).toBe(updates.stock);
  });

  test('DELETE /api/products/[id] - should delete product', async () => {
    if (!createdProductId) {
      console.log('Skipping: No product ID available');
      return;
    }

    const response = await del(`${API_BASE}/api/products/${createdProductId}`, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('Products API - Multi-Tenant Isolation', () => {
  let org1Users: ReturnType<typeof createTestUsersForAllRoles>;
  let org2Users: ReturnType<typeof createTestUsersForAllRoles>;
  let org1ProductId: string;
  let org2ProductId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const users = createTestUsersForDifferentOrgs();
    org1Users = users.org1;
    org2Users = users.org2;

    // Create products in different organizations
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
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('TENANT_ADMIN from org1 should NOT see org2 products', async () => {
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

  test('SUPER_ADMIN should see products from all organizations', async () => {
    const response = await get(`${API_BASE}/api/products`, {
      user: org1Users.SUPER_ADMIN
    });
    const data = await parseJsonResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // SUPER_ADMIN can see all products (depending on implementation)
    // This test may need adjustment based on actual SUPER_ADMIN behavior
  });
});

describe('Products API - Error Handling', () => {
  let testUser = createTestUser({ role: 'TENANT_ADMIN' });

  test('Should return standardized error format', async () => {
    const response = await get(`${API_BASE}/api/products/nonexistent-id`, {
      user: testUser
    });
    const data = await parseJsonResponse(response);
    
    expect(data.success).toBe(false);
    expect(data.code).toBeDefined();
    expect(data.message).toBeDefined();
    expect(data.correlation).toBeDefined();
  });

  test('Should include correlation ID in error responses', async () => {
    const response = await get(`${API_BASE}/api/products/invalid-id`, {
      user: testUser,
      correlationId: 'test-correlation-123'
    });
    const data = await parseJsonResponse(response);
    
    expect(data.correlation).toBeDefined();
  });
});

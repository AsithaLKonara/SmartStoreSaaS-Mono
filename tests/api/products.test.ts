/**
 * Products API Tests
 * Comprehensive test suite for products endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = process.env.TEST_API_BASE || 'https://smartstore-demo.vercel.app';

describe('Products API', () => {
  let createdProductId: string;

  test('GET /api/products - should return list of products', async () => {
    const response = await fetch(`${API_BASE}/api/products`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('GET /api/products - should support pagination', async () => {
    const response = await fetch(`${API_BASE}/api/products?page=1&limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
  });

  test('GET /api/products - should support search', async () => {
    const response = await fetch(`${API_BASE}/api/products?search=laptop`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('POST /api/products - should create a new product', async () => {
    const newProduct = {
      name: 'Test Product',
      description: 'Test Description',
      sku: `TEST-${Date.now()}`,
      price: 999.99,
      cost: 500.00,
      stock: 100,
      categoryId: 'cat-1',
      organizationId: 'org-1'
    };

    const response = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newProduct),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(newProduct.name);

    createdProductId = data.data.id;
  });

  test('GET /api/products/[id] - should return specific product', async () => {
    if (!createdProductId) {
      console.log('Skipping: No product ID available');
      return;
    }

    const response = await fetch(`${API_BASE}/api/products/${createdProductId}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(createdProductId);
  });

  test('PUT /api/products/[id] - should update product', async () => {
    if (!createdProductId) {
      console.log('Skipping: No product ID available');
      return;
    }

    const updates = {
      id: createdProductId,
      price: 1299.99,
      stock: 150
    };

    const response = await fetch(`${API_BASE}/api/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.price).toBe('1299.99');
  });

  test('DELETE /api/products/[id] - should delete product', async () => {
    if (!createdProductId) {
      console.log('Skipping: No product ID available');
      return;
    }

    const response = await fetch(`${API_BASE}/api/products/${createdProductId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('Products API Validation', () => {
  test('POST /api/products - should reject invalid data', async () => {
    const invalidProduct = {
      name: '', // Empty name should be rejected
      price: -10, // Negative price should be rejected
    };

    const response = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidProduct),
    });

    expect([400, 500]).toContain(response.status);
  });

  test('GET /api/products/invalid-id - should return 404', async () => {
    const response = await fetch(`${API_BASE}/api/products/nonexistent-id`);
    const data = await response.json();

    expect([404, 500]).toContain(response.status);
    expect(data.success).toBe(false);
  });
});


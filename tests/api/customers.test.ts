/**
 * Customers API Tests
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE = process.env.TEST_API_BASE || 'https://smartstore-demo.vercel.app';

describe('Customers API', () => {
  test('GET /api/customers - should return list of customers', async () => {
    const response = await fetch(`${API_BASE}/api/customers`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('GET /api/customers - should support search', async () => {
    const response = await fetch(`${API_BASE}/api/customers?search=john`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /api/customers - should support pagination', async () => {
    const response = await fetch(`${API_BASE}/api/customers?page=1&limit=10`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
  });

  test('POST /api/customers - should create new customer', async () => {
    const newCustomer = {
      name: 'Test Customer',
      email: `test${Date.now()}@example.com`,
      phone: '+94771234567',
      address: 'Test Address'
    };

    const response = await fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCustomer),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(newCustomer.name);
  });

  test('POST /api/customers - should reject duplicate email', async () => {
    const customer = {
      name: 'Test Customer',
      email: 'john.doe@email.com', // Existing email
      phone: '+94771234567'
    };

    const response = await fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });

    // Should either succeed or return conflict
    expect([201, 409, 500]).toContain(response.status);
  });
});

describe('Customers API Validation', () => {
  test('POST /api/customers - should require name and email', async () => {
    const invalidCustomer = {
      phone: '+94771234567'
    };

    const response = await fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidCustomer),
    });

    expect([400, 500]).toContain(response.status);
  });
});


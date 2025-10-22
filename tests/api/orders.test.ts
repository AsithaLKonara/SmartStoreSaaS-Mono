/**
 * Orders API Tests
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE = process.env.TEST_API_BASE || 'https://smartstore-demo.vercel.app';

describe('Orders API', () => {
  test('GET /api/orders - should return list of orders', async () => {
    const response = await fetch(`${API_BASE}/api/orders`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('GET /api/orders - should include customer data', async () => {
    const response = await fetch(`${API_BASE}/api/orders`);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.data.length > 0) {
      expect(data.data[0].customer).toBeDefined();
      expect(data.data[0].customer.email).toBeDefined();
    }
  });

  test('GET /api/orders - should support pagination', async () => {
    const response = await fetch(`${API_BASE}/api/orders?page=1&limit=10`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toBeDefined();
  });

  test('POST /api/orders - should create new order', async () => {
    const newOrder = {
      customerId: 'customer-1',
      totalAmount: 1000,
      status: 'PENDING',
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          price: 500
        }
      ]
    };

    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newOrder),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

describe('Orders API - Status Workflow', () => {
  test('Order should have valid status', async () => {
    const response = await fetch(`${API_BASE}/api/orders`);
    const data = await response.json();

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (data.data.length > 0) {
      data.data.forEach((order: any) => {
        expect(validStatuses).toContain(order.status);
      });
    }
  });
});


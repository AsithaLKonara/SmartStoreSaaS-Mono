import { APIRequestContext } from '@playwright/test';

export type SeedType = 'basic' | 'pos' | 'full' | 'customers' | 'products' | 'orders';

export async function seedDatabase(request: APIRequestContext, seedType: SeedType = 'basic') {
  const response = await request.post('/api/test/seed', {
    data: { seed: seedType },
  });
  
  if (!response.ok()) {
    throw new Error(`Seed failed: ${response.status()} ${await response.text()}`);
  }
  
  return response.json();
}

export async function resetDatabase(request: APIRequestContext) {
  const response = await request.post('/api/test/reset-db');
  
  if (!response.ok()) {
    throw new Error(`Reset failed: ${response.status()} ${await response.text()}`);
  }
  
  return response.json();
}

export async function generateVerificationToken(request: APIRequestContext, email: string) {
  const response = await request.post('/api/test/generate-verify', {
    data: { email },
  });
  
  if (!response.ok()) {
    throw new Error(`Token generation failed: ${response.status()}`);
  }
  
  const data = await response.json();
  return data.token;
}

export async function createTestOrganization(request: APIRequestContext, data: {
  name: string;
  domain?: string;
  plan?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
}) {
  const response = await request.post('/api/test/create-org', {
    data,
  });
  
  if (!response.ok()) {
    throw new Error(`Organization creation failed: ${response.status()}`);
  }
  
  return response.json();
}

export async function createTestProduct(request: APIRequestContext, data: {
  name: string;
  sku: string;
  price: number;
  stock?: number;
  organizationId: string;
}) {
  const response = await request.post('/api/test/create-product', {
    data: {
      stock: 100,
      minStock: 10,
      ...data,
    },
  });
  
  if (!response.ok()) {
    throw new Error(`Product creation failed: ${response.status()}`);
  }
  
  return response.json();
}

export async function createTestOrder(request: APIRequestContext, data: {
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  organizationId: string;
}) {
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const shipping = 5.99;
  const total = subtotal + tax + shipping;
  
  const response = await request.post('/api/test/create-order', {
    data: {
      ...data,
      subtotal,
      tax,
      shipping,
      discount: 0,
      total,
    },
  });
  
  if (!response.ok()) {
    throw new Error(`Order creation failed: ${response.status()}`);
  }
  
  return response.json();
}


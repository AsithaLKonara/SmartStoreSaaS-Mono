/**
 * Database Helpers for API Testing
 * 
 * Provides utilities for database setup, teardown, and test data creation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  try {
    // Delete in reverse order of dependencies
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.category.deleteMany({});
    // Add other models as needed
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Create test organization
 */
export async function createTestOrganization(data?: {
  id?: string;
  name?: string;
  email?: string;
}) {
  return await prisma.organization.create({
    data: {
      id: data?.id || `test-org-${Date.now()}`,
      name: data?.name || 'Test Organization',
      email: data?.email || `test-org-${Date.now()}@example.com`,
      isActive: true
    }
  });
}

/**
 * Create test user in database
 */
export async function createTestUser(data?: {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  organizationId?: string;
}) {
  const org = await createTestOrganization({ id: data?.organizationId });
  
  return await prisma.user.create({
    data: {
      id: data?.id || `test-user-${Date.now()}`,
      email: data?.email || `test-${Date.now()}@example.com`,
      name: data?.name || 'Test User',
      role: data?.role || 'TENANT_ADMIN',
      organizationId: org.id,
      isActive: true
    }
  });
}

/**
 * Create test product
 */
export async function createTestProduct(data?: {
  id?: string;
  name?: string;
  sku?: string;
  price?: number;
  organizationId?: string;
}) {
  const org = await createTestOrganization({ id: data?.organizationId });
  
  return await prisma.product.create({
    data: {
      id: data?.id || `test-product-${Date.now()}`,
      name: data?.name || 'Test Product',
      sku: data?.sku || `SKU-${Date.now()}`,
      price: data?.price || 100,
      stock: 10,
      minStock: 5,
      organizationId: org.id,
      isActive: true
    }
  });
}

/**
 * Create test customer
 */
export async function createTestCustomer(data?: {
  id?: string;
  email?: string;
  name?: string;
  organizationId?: string;
}) {
  const org = await createTestOrganization({ id: data?.organizationId });
  
  return await prisma.customer.create({
    data: {
      id: data?.id || `test-customer-${Date.now()}`,
      email: data?.email || `customer-${Date.now()}@example.com`,
      name: data?.name || 'Test Customer',
      organizationId: org.id,
      isActive: true
    }
  });
}

/**
 * Create test order
 */
export async function createTestOrder(data?: {
  id?: string;
  customerId?: string;
  organizationId?: string;
}) {
  const org = await createTestOrganization({ id: data?.organizationId });
  const customer = await createTestCustomer({ organizationId: org.id });
  const product = await createTestProduct({ organizationId: org.id });
  
  const order = await prisma.order.create({
    data: {
      id: data?.id || `test-order-${Date.now()}`,
      customerId: data?.customerId || customer.id,
      organizationId: org.id,
      status: 'PENDING',
      total: 100
    }
  });
  
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      price: 100
    }
  });
  
  return order;
}

/**
 * Setup test database (run before test suite)
 */
export async function setupTestDatabase() {
  await cleanupTestData();
  // Add any initial seed data if needed
}

/**
 * Teardown test database (run after test suite)
 */
export async function teardownTestDatabase() {
  await cleanupTestData();
  await prisma.$disconnect();
}

/**
 * Reset database to clean state
 */
export async function resetTestDatabase() {
  await cleanupTestData();
}

/**
 * Get database connection for direct queries
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

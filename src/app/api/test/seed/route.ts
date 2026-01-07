/**
 * Test API: Seed Database
 * 
 * Only available in test/development environments
 * Seeds test data for E2E tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import usersFixture from '../../../../../tests/e2e/fixtures/users.json';
import productsFixture from '../../../../../tests/e2e/fixtures/products.json';

// Guard: Only allow in test environment
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
  throw new Error('Test endpoints are disabled in production');
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || uuidv4();
  
  try {
    const { seed } = await request.json();
    
    const testOrg = await ensureTestOrganization();
    
    switch (seed) {
      case 'basic':
        await seedBasic(testOrg.id);
        break;
      case 'pos':
        await seedPOS(testOrg.id);
        break;
      case 'products':
        await seedProducts(testOrg.id);
        break;
      case 'customers':
        await seedCustomers(testOrg.id);
        break;
      case 'orders':
        await seedOrders(testOrg.id);
        break;
      case 'full':
        await seedFull(testOrg.id);
        break;
      default:
        await seedBasic(testOrg.id);
    }
    
    return NextResponse.json({
      success: true,
      message: `Database seeded with ${seed} data`,
      organizationId: testOrg.id,
    });
  } catch (error: any) {
    logger.error({
      message: 'Seed error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        errorMessage: error.message,
        seedType: (await request.json()).seed
      },
      correlation: correlationId
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        correlation: correlationId
      },
      { status: 500 }
    );
  }
}

async function ensureTestOrganization() {
  // Create or get test organization
  const existing = await prisma.organization.findFirst({
    where: { domain: 'test' },
  });
  
  if (existing) return existing;
  
  return await prisma.organization.create({
    data: {
      name: 'Test Organization',
      domain: 'test',
      description: 'Test organization for E2E tests',
      status: 'ACTIVE',
      plan: 'PRO',
    },
  });
}

async function seedBasic(orgId: string) {
  // Create test users
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const users = Object.entries(usersFixture);
  
  for (const [key, userData] of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role as any,
        roleTag: (userData as any).roleTag,
        organizationId: orgId,
        isActive: true,
        emailVerified: new Date(),
      },
    });
  }
}

async function seedProducts(orgId: string) {
  // Create test products
  for (const productData of productsFixture.products) {
    const { variants, ...productInfo } = productData as any;
    
    await prisma.product.create({
      data: {
        ...productInfo,
        organizationId: orgId,
        variants: variants ? {
          create: variants.map((v: any) => ({
            ...v,
            organizationId: orgId,
          })),
        } : undefined,
      },
    });
  }
}

async function seedCustomers(orgId: string) {
  // Create test customers
  await prisma.customer.createMany({
    data: [
      {
        name: 'John Doe',
        email: 'john.doe+test@example.com',
        phone: '+94771234567',
        address: '123 Test Street, Colombo',
        organizationId: orgId,
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith+test@example.com',
        phone: '+94777654321',
        address: '456 Sample Road, Kandy',
        organizationId: orgId,
      },
    ],
    skipDuplicates: true,
  });
  
  // Create loyalty records
  const customers = await prisma.customer.findMany({
    where: { organizationId: orgId },
  });
  
  for (const customer of customers) {
    const existingLoyalty = await prisma.customerLoyalty.findFirst({
      where: { customerId: customer.id }
    });

    if (existingLoyalty) {
      await prisma.customerLoyalty.update({
        where: { id: existingLoyalty.id },
        data: {
          points: 100,
          tier: 'BRONZE',
          totalSpent: 0,
        }
      });
    } else {
      await prisma.customerLoyalty.create({
        data: {
          customerId: customer.id,
          points: 100,
          tier: 'BRONZE',
          totalSpent: 0,
        }
      });
    }
  }
}

async function seedOrders(orgId: string) {
  // Ensure we have products and customers
  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    take: 1,
  });
  
  const customers = await prisma.customer.findMany({
    where: { organizationId: orgId },
    take: 1,
  });
  
  if (products.length === 0 || customers.length === 0) {
    await seedProducts(orgId);
    await seedCustomers(orgId);
  }
  
  const product = products[0] || await prisma.product.findFirst({ where: { organizationId: orgId } });
  const customer = customers[0] || await prisma.customer.findFirst({ where: { organizationId: orgId } });
  
  if (!product || !customer) {
    throw new Error('Failed to seed orders: no products or customers');
  }
  
  // Create test orders
  await prisma.order.create({
    data: {
      orderNumber: `TEST-${Date.now()}`,
      customerId: customer.id,
      organizationId: orgId,
      status: 'PENDING',
      subtotal: 29.99,
      tax: 2.40,
      shipping: 5.99,
      discount: 0,
      total: 38.38,
      orderItems: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            price: 29.99,
            total: 29.99,
          },
        ],
      },
    },
  });
}

async function seedPOS(orgId: string) {
  await seedBasic(orgId);
  await seedProducts(orgId);
  await seedCustomers(orgId);
}

async function seedFull(orgId: string) {
  await seedBasic(orgId);
  await seedProducts(orgId);
  await seedCustomers(orgId);
  await seedOrders(orgId);
}


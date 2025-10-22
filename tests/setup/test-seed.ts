/**
 * Consolidated Test Seed Data
 * Creates predictable test data for all 4 roles with consistent IDs
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestData {
  organizations: any[];
  users: any[];
  categories: any[];
  products: any[];
  customers: any[];
  orders: any[];
}

/**
 * Create test organizations
 */
export async function seedOrganizations() {
  console.log('📊 Seeding test organizations...');
  
  const superAdminOrg = await prisma.organization.upsert({
    where: { id: 'test-super-admin-org' },
    update: {},
    create: {
      id: 'test-super-admin-org',
      name: 'SmartStore Platform',
      domain: 'smartstore.com',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      settings: {
        description: 'Platform administration organization',
        currency: 'USD',
        timezone: 'UTC'
      }
    }
  });

  const tenantOrg = await prisma.organization.upsert({
    where: { id: 'test-techhub-org' },
    update: {},
    create: {
      id: 'test-techhub-org',
      name: 'TechHub LK',
      domain: 'techhub.lk',
      plan: 'PRO',
      status: 'ACTIVE',
      settings: {
        description: 'Technology retailer in Sri Lanka',
        currency: 'LKR',
        timezone: 'Asia/Colombo'
      }
    }
  });

  console.log('✅ Created 2 test organizations');
  return [superAdminOrg, tenantOrg];
}

/**
 * Create test users for all 4 roles
 */
export async function seedUsers(organizations: any[]) {
  console.log('👥 Seeding test users (4 roles)...');
  
  const [superAdminOrg, tenantOrg] = organizations;
  
  // 1. SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smartstore.com' },
    update: {},
    create: {
      id: 'test-super-admin',
      email: 'superadmin@smartstore.com',
      name: 'Super Admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'SUPER_ADMIN',
      organizationId: superAdminOrg.id,
      isActive: true,
      emailVerified: new Date()
    }
  });

  // 2. TENANT_ADMIN
  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'admin@techhub.lk' },
    update: {},
    create: {
      id: 'test-tenant-admin',
      email: 'admin@techhub.lk',
      name: 'TechHub Admin',
      password: await bcrypt.hash('password123', 10),
      role: 'TENANT_ADMIN',
      organizationId: tenantOrg.id,
      isActive: true,
      emailVerified: new Date()
    }
  });

  // 3. STAFF
  const staff = await prisma.user.upsert({
    where: { email: 'staff@techhub.lk' },
    update: {},
    create: {
      id: 'test-staff',
      email: 'staff@techhub.lk',
      name: 'Staff Member',
      password: await bcrypt.hash('staff123', 10),
      role: 'STAFF',
      roleTag: 'sales_staff',
      organizationId: tenantOrg.id,
      isActive: true,
      emailVerified: new Date()
    }
  });

  // 4. CUSTOMER
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      id: 'test-customer',
      email: 'customer@example.com',
      name: 'Test Customer',
      password: await bcrypt.hash('customer123', 10),
      role: 'CUSTOMER',
      organizationId: tenantOrg.id,
      isActive: true,
      emailVerified: new Date()
    }
  });

  console.log('✅ Created 4 test users (all roles)');
  return [superAdmin, tenantAdmin, staff, customer];
}

/**
 * Create test categories
 */
export async function seedCategories() {
  console.log('📂 Seeding test categories...');
  
  const categoryNames = [
    'Electronics',
    'Computers',
    'Mobile Phones',
    'Accessories',
    'Software'
  ];

  const categories = [];
  for (let i = 0; i < categoryNames.length; i++) {
    const category = await prisma.category.upsert({
      where: { id: `test-category-${i + 1}` },
      update: {},
      create: {
        id: `test-category-${i + 1}`,
        name: categoryNames[i],
        description: `${categoryNames[i]} for testing`,
        slug: categoryNames[i].toLowerCase().replace(/ /g, '-'),
        isActive: true
      }
    });
    categories.push(category);
  }

  console.log(`✅ Created ${categories.length} test categories`);
  return categories;
}

/**
 * Create test products
 */
export async function seedProducts(categories: any[], organization: any) {
  console.log('🛍️ Seeding test products...');
  
  const productData = [
    { name: 'Laptop Pro 15', price: 1299.99, sku: 'TEST-LAP-001', stock: 50 },
    { name: 'Wireless Mouse', price: 29.99, sku: 'TEST-MOU-001', stock: 200 },
    { name: 'USB-C Hub', price: 49.99, sku: 'TEST-HUB-001', stock: 150 },
    { name: 'Mechanical Keyboard', price: 89.99, sku: 'TEST-KEY-001', stock: 100 },
    { name: 'Monitor 27"', price: 399.99, sku: 'TEST-MON-001', stock: 75 },
    { name: 'Webcam HD', price: 79.99, sku: 'TEST-CAM-001', stock: 120 },
    { name: 'Headphones', price: 149.99, sku: 'TEST-HEA-001', stock: 180 },
    { name: 'Desk Lamp', price: 39.99, sku: 'TEST-LAM-001', stock: 90 },
    { name: 'Cable Pack', price: 19.99, sku: 'TEST-CAB-001', stock: 300 },
    { name: 'Phone Stand', price: 24.99, sku: 'TEST-STA-001', stock: 250 }
  ];

  const products = [];
  for (let i = 0; i < productData.length; i++) {
    const data = productData[i];
    const product = await prisma.product.upsert({
      where: { id: `test-product-${i + 1}` },
      update: {},
      create: {
        id: `test-product-${i + 1}`,
        name: data.name,
        description: `Test product: ${data.name}`,
        sku: data.sku,
        price: data.price,
        cost: data.price * 0.6,
        stock: data.stock,
        lowStockThreshold: 10,
        categoryId: categories[i % categories.length].id,
        organizationId: organization.id,
        isActive: true,
        images: [`https://placehold.co/400x400?text=${data.name.replace(/ /g, '+')}`]
      }
    });
    products.push(product);
  }

  console.log(`✅ Created ${products.length} test products`);
  return products;
}

/**
 * Create test customers
 */
export async function seedCustomers(organization: any) {
  console.log('👤 Seeding test customers...');
  
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    const customer = await prisma.customer.upsert({
      where: { id: `test-customer-${i}` },
      update: {},
      create: {
        id: `test-customer-${i}`,
        name: `Test Customer ${i}`,
        email: `customer${i}@test.com`,
        phone: `+1234567${String(i).padStart(3, '0')}`,
        organizationId: organization.id,
        address: `${i * 100} Test Street`,
        city: 'Test City',
        country: 'Test Country',
        postalCode: `${i * 1000}`
      }
    });
    customers.push(customer);
  }

  console.log(`✅ Created ${customers.length} test customers`);
  return customers;
}

/**
 * Create test orders
 */
export async function seedOrders(customers: any[], products: any[], organization: any) {
  console.log('📦 Seeding test orders...');
  
  const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
  const orders = [];

  for (let i = 1; i <= 10; i++) {
    const customer = customers[i % customers.length];
    const order = await prisma.order.upsert({
      where: { id: `test-order-${i}` },
      update: {},
      create: {
        id: `test-order-${i}`,
        orderNumber: `TEST-ORD-${String(i).padStart(5, '0')}`,
        customerId: customer.id,
        organizationId: organization.id,
        status: statuses[i % statuses.length],
        subtotal: 100 * i,
        tax: 10 * i,
        total: 110 * i,
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD'
      }
    });
    orders.push(order);
  }

  console.log(`✅ Created ${orders.length} test orders`);
  return orders;
}

/**
 * Main seed function - runs all seeds in order
 */
export async function seedTestData(): Promise<TestData> {
  console.log('🌱 Starting comprehensive test data seeding...\n');

  try {
    const organizations = await seedOrganizations();
    const users = await seedUsers(organizations);
    const categories = await seedCategories();
    const products = await seedProducts(categories, organizations[1]); // Use tenant org
    const customers = await seedCustomers(organizations[1]);
    const orders = await seedOrders(customers, products, organizations[1]);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Organizations: ${organizations.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Orders: ${orders.length}`);

    return {
      organizations,
      users,
      categories,
      products,
      customers,
      orders
    };
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    await prisma.orderItem.deleteMany({ where: { orderId: { startsWith: 'test-' } } });
    await prisma.order.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.customer.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.product.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.category.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.user.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.organization.deleteMany({ where: { id: { startsWith: 'test-' } } });
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
}

/**
 * Run seed if called directly
 */
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}




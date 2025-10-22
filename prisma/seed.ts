import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create organizations
  const organization1 = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'SmartStore Demo',
      domain: 'smartstore-demo.com',
      plan: 'PRO',
      status: 'ACTIVE',
        description: 'Demo organization for SmartStore SaaS platform',
      settings: JSON.stringify({
        website: 'https://smartstore-demo.com',
        logo: 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=SS',
        address: {
          street: '123 Business Street',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00100',
        },
        phone: '+94 11 234 5678',
        email: 'demo@smartstore.com',
        currency: 'LKR',
        timezone: 'Asia/Colombo',
        features: {
          courierManagement: true,
          analytics: true,
          loyaltyProgram: true,
          socialCommerce: true,
          notifications: true,
          wishlist: true,
          coupons: true,
          aiInsights: true,
          bulkOperations: true,
          multiLanguage: true,
        },
      }),
    },
  });

  const organization2 = await prisma.organization.upsert({
    where: { id: 'org-2' },
    update: {},
    create: {
      id: 'org-2',
      name: 'Tech Solutions Ltd',
      domain: 'techsolutions.lk',
      plan: 'BASIC',
      status: 'ACTIVE',
        description: 'Technology solutions provider',
      settings: JSON.stringify({
        website: 'https://techsolutions.lk',
        logo: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=TS',
        address: {
          street: '456 Tech Avenue',
          city: 'Kandy',
          state: 'Central Province',
          country: 'Sri Lanka',
          postalCode: '20000',
        },
        phone: '+94 81 234 5678',
        email: 'info@techsolutions.lk',
        currency: 'LKR',
        timezone: 'Asia/Colombo',
        features: {
          courierManagement: true,
          analytics: false,
          loyaltyProgram: false,
          socialCommerce: true,
          notifications: true,
          wishlist: false,
          coupons: true,
          aiInsights: false,
          bulkOperations: false,
          multiLanguage: false,
        },
      }),
    },
  });

  // Create users
  const hashedPassword = await hash('password123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartstore.com' },
    update: {},
    create: {
      email: 'admin@smartstore.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'TENANT_ADMIN',
      organizationId: organization1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@smartstore.com' },
    update: {},
    create: {
      email: 'manager@smartstore.com',
      name: 'Manager User',
      password: hashedPassword,
      role: 'STAFF',
      roleTag: 'manager',
      organizationId: organization1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@smartstore.com' },
    update: {},
    create: {
      email: 'staff@smartstore.com',
      name: 'Staff User',
      password: hashedPassword,
      role: 'STAFF',
      roleTag: 'staff',
      organizationId: organization1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      email: 'customer1@example.com',
      name: 'John Doe',
      phone: '+94 77 123 4567',
      organizationId: organization1.id,
      address: JSON.stringify({
        street: '789 Customer Street',
        city: 'Colombo',
        state: 'Western Province',
        country: 'Sri Lanka',
        postalCode: '00200',
      }),
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      email: 'customer2@example.com',
      name: 'Jane Smith',
      phone: '+94 77 234 5678',
      organizationId: organization1.id,
      address: JSON.stringify({
        street: '321 Customer Avenue',
        city: 'Galle',
        state: 'Southern Province',
        country: 'Sri Lanka',
        postalCode: '80000',
      }),
    },
  });

  // Create categories
  const category1 = await prisma.category.upsert({
    where: { id: 'cat-1' },
    update: {},
    create: {
      id: 'cat-1',
      name: 'Electronics',
      description: 'Electronic devices and accessories',
        isActive: true,
    },
  });

  const category2 = await prisma.category.upsert({
    where: { id: 'cat-2' },
    update: {},
    create: {
      id: 'cat-2',
      name: 'Clothing',
      description: 'Fashion and apparel',
        isActive: true,
    },
  });

  const category3 = await prisma.category.upsert({
    where: { id: 'cat-3' },
    update: {},
    create: {
      id: 'cat-3',
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
        isActive: true,
    },
  });

  // Create products
  const product1 = await prisma.product.upsert({
    where: { id: 'prod-1' },
    update: {},
    create: {
      id: 'prod-1',
      name: 'Smartphone Pro Max',
      description: 'Latest smartphone with advanced features',
      sku: 'SPM-001',
      price: 125000,
      cost: 100000,
      stock: 50,
      minStock: 5,
      weight: 0.2,
      dimensions: '15x7x0.8',
      tags: 'smartphone,mobile,electronics',
      organizationId: organization1.id,
      categoryId: category1.id,
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'prod-2' },
    update: {},
    create: {
      id: 'prod-2',
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      sku: 'WH-001',
      price: 25000,
      cost: 18000,
      stock: 100,
      minStock: 10,
      weight: 0.3,
      dimensions: '20x18x8',
      tags: 'headphones,wireless,audio',
      organizationId: organization1.id,
      categoryId: category1.id,
      isActive: true,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { id: 'prod-3' },
    update: {},
    create: {
      id: 'prod-3',
      name: 'Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt in various sizes',
      sku: 'CTS-001',
      price: 2500,
      cost: 1500,
      stock: 200,
      minStock: 20,
      weight: 0.2,
      dimensions: '30x25x1',
      tags: 'clothing,t-shirt,cotton',
      organizationId: organization1.id,
      categoryId: category2.id,
      isActive: true,
    },
  });

  // Create couriers
  const courier1 = await prisma.courier.upsert({
    where: { id: 'courier-1' },
    update: {},
    create: {
      id: 'courier-1',
      name: 'Domex Express',
      phone: '+94 11 500 5000',
      email: 'support@domex.lk',
      organizationId: organization1.id,
        isActive: true,
    },
  });

  const courier2 = await prisma.courier.upsert({
    where: { id: 'courier-2' },
    update: {},
    create: {
      id: 'courier-2',
      name: 'Pronto Lanka',
      phone: '+94 11 400 4000',
      email: 'info@prontolanka.lk',
      organizationId: organization1.id,
        isActive: true,
    },
  });

  // Create orders
  const order1 = await prisma.order.upsert({
    where: { id: 'order-1' },
    update: {},
    create: {
      id: 'order-1',
      orderNumber: 'ORD001',
      customerId: customer1.id,
      organizationId: organization1.id,
      status: 'CONFIRMED',
      total: 150000,
      subtotal: 140000,
      tax: 10000,
      shipping: 0,
      discount: 0,
    },
  });

  const order2 = await prisma.order.upsert({
    where: { id: 'order-2' },
    update: {},
    create: {
      id: 'order-2',
      orderNumber: 'ORD002',
      customerId: customer2.id,
      organizationId: organization1.id,
      status: 'SHIPPED',
      total: 27500,
      subtotal: 25000,
      tax: 2500,
      shipping: 0,
      discount: 0,
    },
  });

  // Create order items
  await prisma.orderItem.upsert({
    where: { id: 'item-1' },
    update: {},
    create: {
      id: 'item-1',
      orderId: order1.id,
      productId: product1.id,
      quantity: 1,
      price: 125000,
      total: 125000,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: 'item-2' },
    update: {},
    create: {
      id: 'item-2',
      orderId: order1.id,
      productId: product2.id,
        quantity: 1,
      price: 25000,
      total: 25000,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: 'item-3' },
    update: {},
    create: {
      id: 'item-3',
      orderId: order2.id,
      productId: product2.id,
        quantity: 1,
      price: 25000,
      total: 25000,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: 'item-4' },
    update: {},
    create: {
      id: 'item-4',
      orderId: order2.id,
      productId: product3.id,
        quantity: 1,
      price: 2500,
      total: 2500,
    },
  });

  // Create payments
  await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
        orderId: order1.id,
      organizationId: organization1.id,
      amount: 150000,
        currency: 'LKR',
      method: 'CARD',
      gateway: 'STRIPE',
        status: 'COMPLETED',
      transactionId: 'txn_123456789',
    },
  });

  await prisma.payment.upsert({
    where: { id: 'payment-2' },
    update: {},
    create: {
      id: 'payment-2',
        orderId: order2.id,
      organizationId: organization1.id,
      amount: 27500,
        currency: 'LKR',
      method: 'COD',
      gateway: 'CASH',
      status: 'PENDING',
      transactionId: 'cod_987654321',
    },
  });

  // Create deliveries
  await prisma.delivery.upsert({
    where: { id: 'delivery-1' },
    update: {},
    create: {
      id: 'delivery-1',
      orderId: order1.id,
      courierId: courier1.id,
      organizationId: organization1.id,
      status: 'PENDING',
      trackingNumber: 'TRK12345678',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    },
  });

  await prisma.delivery.upsert({
    where: { id: 'delivery-2' },
    update: {},
    create: {
      id: 'delivery-2',
      orderId: order2.id,
      courierId: courier2.id,
      organizationId: organization1.id,
      status: 'DISPATCHED',
      trackingNumber: 'TRK87654321',
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    },
  });

  // Create customer loyalty records
  await prisma.customerLoyalty.upsert({
    where: { id: 'loyalty-1' },
    update: {},
    create: {
      id: 'loyalty-1',
      customerId: customer1.id,
      points: 1000,
      tier: 'SILVER',
      totalSpent: 500,
      lastActivity: new Date(),
    },
  });

  await prisma.customerLoyalty.upsert({
    where: { id: 'loyalty-2' },
    update: {},
    create: {
      id: 'loyalty-2',
      customerId: customer2.id,
      points: 500,
      tier: 'BRONZE',
      totalSpent: 250,
      lastActivity: new Date(),
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Created:');
  console.log('  - 2 Organizations');
  console.log('  - 3 Users (Admin, Manager, Staff)');
  console.log('  - 2 Customers');
  console.log('  - 3 Categories');
  console.log('  - 3 Products');
  console.log('  - 2 Couriers');
  console.log('  - 2 Orders with items');
  console.log('  - 2 Payments');
  console.log('  - 2 Deliveries');
  console.log('  - 2 Customer loyalty records');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
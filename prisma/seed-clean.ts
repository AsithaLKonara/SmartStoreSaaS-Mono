import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartstore.lk' },
    update: {},
    create: {
      email: 'admin@smartstore.lk',
      name: 'Admin User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HSy.8K2', // admin123
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // Create sample organization
  const organization = await prisma.organization.upsert({
    where: { id: 'sample-org-1' },
    update: {},
    create: {
      id: 'sample-org-1',
      name: 'Sample Business Ltd',
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      settings: {
        currency: 'LKR',
        timezone: 'Asia/Colombo',
        language: 'en'
      },
    },
  });

  // Create packages
  const starterPackage = await prisma.package.upsert({
    where: { id: 'starter-package' },
    update: {},
    create: {
      id: 'starter-package',
      name: 'Starter Plan',
      description: 'Perfect for small businesses',
      price: 29.99,
      currency: 'LKR',
      billingCycle: 'MONTHLY',
      features: {
        maxUsers: 5,
        maxOrders: 100,
        maxStorage: 100
      },
      isActive: true,
      isTrial: false,
      trialDays: 0,
      maxUsers: 5,
      maxOrders: 100,
      maxStorage: 100,
    },
  });

  const professionalPackage = await prisma.package.upsert({
    where: { id: 'professional-package' },
    update: {},
    create: {
      id: 'professional-package',
      name: 'Professional Plan',
      description: 'For growing businesses',
      price: 99.99,
      currency: 'LKR',
      billingCycle: 'MONTHLY',
      features: {
        maxUsers: 25,
        maxOrders: 1000,
        maxStorage: 500
      },
      isActive: true,
      isTrial: false,
      trialDays: 0,
      maxUsers: 25,
      maxOrders: 1000,
      maxStorage: 500,
    },
  });

  // Create courier services
  const domexService = await prisma.courierService.upsert({
    where: { id: 'domex-service' },
    update: {},
    create: {
      id: 'domex-service',
      name: 'Domex',
      displayName: 'Domex Express',
      apiEndpoint: 'https://api.domex.lk',
      isActive: true,
      coverage: ['Colombo', 'Gampaha', 'Kalutara'],
      features: {
        tracking: true,
        labelPrinting: true,
        pickup: true
      },
      pricing: {
        baseRate: 150,
        perKg: 25
      },
    },
  });

  const prontoService = await prisma.courierService.upsert({
    where: { id: 'pronto-service' },
    update: {},
    create: {
      id: 'pronto-service',
      name: 'Pronto',
      displayName: 'Pronto Express',
      apiEndpoint: 'https://api.pronto.lk',
      isActive: true,
      coverage: ['Colombo', 'Kandy', 'Galle'],
      features: {
        tracking: true,
        labelPrinting: true,
        pickup: true
      },
      pricing: {
        baseRate: 120,
        perKg: 20
      },
    },
  });

  // Create warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'main-warehouse' },
    update: {},
    create: {
      id: 'main-warehouse',
      name: 'Main Warehouse',
      address: '123 Warehouse Street, Colombo',
      capacity: 1000,
      organizationId: organization.id,
      isActive: true,
    },
  });

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      organizationId: organization.id,
      packageId: professionalPackage.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isTrial: false,
      autoRenew: true,
    },
  });

  // Create sample products
  const product1 = await prisma.product.upsert({
    where: { id: 'product-1' },
    update: {},
    create: {
      id: 'product-1',
      name: 'Sample Product 1',
      description: 'A sample product for testing',
      sku: 'SP001',
      price: 1000,
      cost: 500,
      organizationId: organization.id,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'product-2' },
    update: {},
    create: {
      id: 'product-2',
      name: 'Sample Product 2',
      description: 'Another sample product for testing',
      sku: 'SP002',
      price: 2000,
      cost: 1000,
      organizationId: organization.id,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // Create inventory movements
  await prisma.inventoryMovement.createMany({
    data: [
      {
        warehouseId: warehouse.id,
        productId: product1.id,
        type: 'IN',
        quantity: 100,
        reason: 'Initial Stock',
        reference: 'INIT-001',
      },
      {
        warehouseId: warehouse.id,
        productId: product2.id,
        type: 'IN',
        quantity: 50,
        reason: 'Initial Stock',
        reference: 'INIT-002',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('  - 1 Admin user');
  console.log('  - 1 Organization');
  console.log('  - 2 Packages');
  console.log('  - 2 Courier services');
  console.log('  - 1 Warehouse');
  console.log('  - 1 Subscription');
  console.log('  - 2 Products');
  console.log('  - 2 Inventory movements');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



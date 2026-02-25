import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ─── ORGANIZATIONS ───────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'SmartStore Demo',
      domain: 'smartstore-demo.com',
      plan: 'PRO',
      status: 'ACTIVE',
      description: 'Demo organization for SmartStore SaaS platform',
      settings: {
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
      },
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { id: 'org-2' },
    update: {},
    create: {
      id: 'org-2',
      name: 'Tech Solutions Ltd',
      domain: 'techsolutions.lk',
      plan: 'BASIC',
      status: 'ACTIVE',
      description: 'Technology solutions provider',
      settings: {
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
      },
    },
  });

  // ─── USERS ───────────────────────────────────────────────────────
  // Superadmin password: SuperAdmin123! — matches LoginForm.tsx defaults
  const superAdminHash = await hash('SuperAdmin123!', 12);
  // General password for other demo users
  const demoHash = await hash('Demo1234!', 12);

  // SUPER_ADMIN — the default login page credentials
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smartstore.com' },
    update: { password: superAdminHash },
    create: {
      email: 'superadmin@smartstore.com',
      name: 'Super Admin',
      password: superAdminHash,
      role: 'SUPER_ADMIN',
      organizationId: org1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // TENANT_ADMIN for org-1
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartstore.com' },
    update: { password: demoHash },
    create: {
      email: 'admin@smartstore.com',
      name: 'Admin User',
      password: demoHash,
      role: 'TENANT_ADMIN',
      organizationId: org1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // STAFF for org-1
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@smartstore.com' },
    update: { password: demoHash },
    create: {
      email: 'manager@smartstore.com',
      name: 'Manager User',
      password: demoHash,
      role: 'STAFF',
      roleTag: 'manager',
      organizationId: org1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@smartstore.com' },
    update: { password: demoHash },
    create: {
      email: 'staff@smartstore.com',
      name: 'Staff User',
      password: demoHash,
      role: 'STAFF',
      roleTag: 'inventory_manager',
      organizationId: org1.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // TENANT_ADMIN for org-2
  const org2Admin = await prisma.user.upsert({
    where: { email: 'admin@techsolutions.lk' },
    update: { password: demoHash },
    create: {
      email: 'admin@techsolutions.lk',
      name: 'Tech Admin',
      password: demoHash,
      role: 'TENANT_ADMIN',
      organizationId: org2.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // ─── CATEGORIES ─────────────────────────────────────────────────
  const catElectronics = await prisma.category.upsert({
    where: { id: 'cat-1' },
    update: {},
    create: {
      id: 'cat-1',
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      organizationId: org1.id,
      isActive: true,
    },
  });

  const catClothing = await prisma.category.upsert({
    where: { id: 'cat-2' },
    update: {},
    create: {
      id: 'cat-2',
      name: 'Clothing',
      description: 'Fashion and apparel',
      organizationId: org1.id,
      isActive: true,
    },
  });

  const catHome = await prisma.category.upsert({
    where: { id: 'cat-3' },
    update: {},
    create: {
      id: 'cat-3',
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
      organizationId: org1.id,
      isActive: true,
    },
  });

  // ─── PRODUCTS ───────────────────────────────────────────────────
  const product1 = await prisma.product.upsert({
    where: { sku: 'SPM-001' },
    update: {},
    create: {
      id: 'prod-1',
      name: 'Smartphone Pro Max',
      description: 'Latest smartphone with advanced AI camera features',
      sku: 'SPM-001',
      price: 125000,
      cost: 100000,
      stock: 50,
      minStock: 5,
      lowStockThreshold: 10,
      reorderPoint: 15,
      weight: 0.2,
      dimensions: '15x7x0.8',
      tags: 'smartphone,mobile,electronics,flagship',
      organizationId: org1.id,
      categoryId: catElectronics.id,
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'WH-001' },
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
      lowStockThreshold: 20,
      reorderPoint: 25,
      weight: 0.3,
      dimensions: '20x18x8',
      tags: 'headphones,wireless,audio,bluetooth',
      organizationId: org1.id,
      categoryId: catElectronics.id,
      isActive: true,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { sku: 'CTS-001' },
    update: {},
    create: {
      id: 'prod-3',
      name: 'Premium Cotton T-Shirt',
      description: 'Comfortable premium cotton t-shirt in various sizes',
      sku: 'CTS-001',
      price: 2500,
      cost: 1500,
      stock: 200,
      minStock: 20,
      lowStockThreshold: 30,
      reorderPoint: 50,
      weight: 0.2,
      dimensions: '30x25x1',
      tags: 'clothing,t-shirt,cotton,fashion',
      organizationId: org1.id,
      categoryId: catClothing.id,
      isActive: true,
    },
  });

  const product4 = await prisma.product.upsert({
    where: { sku: 'LAPTOP-001' },
    update: {},
    create: {
      id: 'prod-4',
      name: 'UltraBook Pro 15',
      description: 'Slim high-performance laptop for professionals',
      sku: 'LAPTOP-001',
      price: 285000,
      cost: 230000,
      stock: 25,
      minStock: 3,
      lowStockThreshold: 5,
      reorderPoint: 8,
      weight: 1.5,
      dimensions: '35x24x1.5',
      tags: 'laptop,computer,electronics,professional',
      organizationId: org1.id,
      categoryId: catElectronics.id,
      isActive: true,
    },
  });

  const product5 = await prisma.product.upsert({
    where: { sku: 'GDN-001' },
    update: {},
    create: {
      id: 'prod-5',
      name: 'Garden Tool Set',
      description: 'Complete 5-piece stainless steel garden tool set',
      sku: 'GDN-001',
      price: 4500,
      cost: 3000,
      stock: 80,
      minStock: 10,
      lowStockThreshold: 15,
      reorderPoint: 20,
      weight: 2.0,
      dimensions: '35x12x10',
      tags: 'garden,tools,home,outdoor',
      organizationId: org1.id,
      categoryId: catHome.id,
      isActive: true,
    },
  });

  // ─── CUSTOMERS ──────────────────────────────────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      email: 'john.doe@example.com',
      name: 'John Doe',
      phone: '+94 77 123 4567',
      organizationId: org1.id,
      totalSpent: 177500,
      address: {
        street: '789 Customer Street',
        city: 'Colombo',
        state: 'Western Province',
        country: 'Sri Lanka',
        postalCode: '00200',
      },
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      phone: '+94 77 234 5678',
      organizationId: org1.id,
      totalSpent: 27500,
      address: {
        street: '321 Customer Avenue',
        city: 'Galle',
        state: 'Southern Province',
        country: 'Sri Lanka',
        postalCode: '80000',
      },
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: 'customer-3' },
    update: {},
    create: {
      id: 'customer-3',
      email: 'kamal.perera@example.com',
      name: 'Kamal Perera',
      phone: '+94 71 345 6789',
      organizationId: org1.id,
      totalSpent: 310000,
      address: {
        street: '55 Kandy Road',
        city: 'Kandy',
        state: 'Central Province',
        country: 'Sri Lanka',
        postalCode: '20000',
      },
    },
  });

  // ─── WAREHOUSE ──────────────────────────────────────────────────
  const warehouse1 = await prisma.warehouse.upsert({
    where: { id: 'wh-1' },
    update: {},
    create: {
      id: 'wh-1',
      name: 'Main Warehouse - Colombo',
      organizationId: org1.id,
      address: {
        street: '1 Warehouse Road',
        city: 'Colombo',
        country: 'Sri Lanka',
      },
    },
  });

  // ─── COURIERS ───────────────────────────────────────────────────
  const courier1 = await prisma.courier.upsert({
    where: { id: 'courier-1' },
    update: {},
    create: {
      id: 'courier-1',
      name: 'Domex Express',
      phone: '+94 11 500 5000',
      email: 'support@domex.lk',
      organizationId: org1.id,
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
      organizationId: org1.id,
      isActive: true,
    },
  });

  // ─── ORDERS ─────────────────────────────────────────────────────
  const order1 = await prisma.order.upsert({
    where: { id: 'order-1' },
    update: {},
    create: {
      id: 'order-1',
      orderNumber: 'ORD-2024-001',
      customerId: customer1.id,
      organizationId: org1.id,
      status: 'DELIVERED',
      total: 150000,
      subtotal: 140000,
      tax: 10000,
      shipping: 0,
      discount: 0,
      createdById: adminUser.id,
    },
  });

  const order2 = await prisma.order.upsert({
    where: { id: 'order-2' },
    update: {},
    create: {
      id: 'order-2',
      orderNumber: 'ORD-2024-002',
      customerId: customer2.id,
      organizationId: org1.id,
      status: 'SHIPPED',
      total: 27500,
      subtotal: 25000,
      tax: 2500,
      shipping: 0,
      discount: 0,
      createdById: adminUser.id,
    },
  });

  const order3 = await prisma.order.upsert({
    where: { id: 'order-3' },
    update: {},
    create: {
      id: 'order-3',
      orderNumber: 'ORD-2024-003',
      customerId: customer3.id,
      organizationId: org1.id,
      status: 'PROCESSING',
      total: 310000,
      subtotal: 295000,
      tax: 15000,
      shipping: 0,
      discount: 0,
      createdById: adminUser.id,
    },
  });

  const order4 = await prisma.order.upsert({
    where: { id: 'order-4' },
    update: {},
    create: {
      id: 'order-4',
      orderNumber: 'ORD-2024-004',
      customerId: customer1.id,
      organizationId: org1.id,
      status: 'PENDING',
      total: 27500,
      subtotal: 25000,
      tax: 2500,
      shipping: 0,
      discount: 0,
      createdById: staffUser.id,
    },
  });

  // ─── ORDER ITEMS ────────────────────────────────────────────────
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
      orderId: order3.id,
      productId: product4.id,
      quantity: 1,
      price: 285000,
      total: 285000,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: 'item-5' },
    update: {},
    create: {
      id: 'item-5',
      orderId: order4.id,
      productId: product2.id,
      quantity: 1,
      price: 25000,
      total: 25000,
    },
  });

  // ─── PAYMENTS ───────────────────────────────────────────────────
  await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      orderId: order1.id,
      organizationId: org1.id,
      amount: 150000,
      currency: 'LKR',
      method: 'CARD',
      gateway: 'STRIPE',
      status: 'PAID',
      transactionId: 'txn_demo_001',
    },
  });

  await prisma.payment.upsert({
    where: { id: 'payment-2' },
    update: {},
    create: {
      id: 'payment-2',
      orderId: order2.id,
      organizationId: org1.id,
      amount: 27500,
      currency: 'LKR',
      method: 'COD',
      gateway: 'CASH',
      status: 'PENDING',
      transactionId: 'cod_demo_002',
    },
  });

  await prisma.payment.upsert({
    where: { id: 'payment-3' },
    update: {},
    create: {
      id: 'payment-3',
      orderId: order3.id,
      organizationId: org1.id,
      amount: 310000,
      currency: 'LKR',
      method: 'BANK_TRANSFER',
      gateway: 'PAYHERE',
      status: 'PAID',
      transactionId: 'ph_demo_003',
    },
  });

  // ─── DELIVERIES ─────────────────────────────────────────────────
  await prisma.delivery.upsert({
    where: { id: 'delivery-1' },
    update: {},
    create: {
      id: 'delivery-1',
      orderId: order1.id,
      courierId: courier1.id,
      organizationId: org1.id,
      status: 'DELIVERED',
      trackingNumber: 'TRK-DEMO-001',
      estimatedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      actualDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.delivery.upsert({
    where: { id: 'delivery-2' },
    update: {},
    create: {
      id: 'delivery-2',
      orderId: order2.id,
      courierId: courier2.id,
      organizationId: org1.id,
      status: 'SHIPPED',
      trackingNumber: 'TRK-DEMO-002',
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  // ─── CUSTOMER LOYALTY ───────────────────────────────────────────
  await prisma.customerLoyalty.upsert({
    where: { id: 'loyalty-1' },
    update: {},
    create: {
      id: 'loyalty-1',
      customerId: customer1.id,
      points: 1775,
      tier: 'GOLD',
      totalSpent: 177500,
      lastActivity: new Date(),
    },
  });

  await prisma.customerLoyalty.upsert({
    where: { id: 'loyalty-2' },
    update: {},
    create: {
      id: 'loyalty-2',
      customerId: customer2.id,
      points: 275,
      tier: 'BRONZE',
      totalSpent: 27500,
      lastActivity: new Date(),
    },
  });

  await prisma.customerLoyalty.upsert({
    where: { id: 'loyalty-3' },
    update: {},
    create: {
      id: 'loyalty-3',
      customerId: customer3.id,
      points: 3100,
      tier: 'PLATINUM',
      totalSpent: 310000,
      lastActivity: new Date(),
    },
  });

  // ─── SUPPLIER ───────────────────────────────────────────────────
  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supplier-1' },
    update: {},
    create: {
      id: 'supplier-1',
      code: 'SUP-001',
      name: 'TechImport Lanka',
      contactName: 'Dinesh Fernando',
      email: 'dinesh@techimport.lk',
      phone: '+94 11 234 9999',
      status: 'ACTIVE',
      currency: 'LKR',
      paymentTerms: 'Net 30',
      isActive: true,
      organizationId: org1.id,
    },
  });

  // ─── SUBSCRIPTION ───────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { organizationId: org1.id },
    update: {},
    create: {
      organizationId: org1.id,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(),
    },
  });

  // ─── SUMMARY ────────────────────────────────────────────────────
  console.log('');
  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('📊 Seeded:');
  console.log('  🏢  2 Organizations (SmartStore Demo, Tech Solutions Ltd)');
  console.log('  👤  5 Users');
  console.log('');
  console.log('  🔐 Login Credentials:');
  console.log('  ┌─────────────────────────────────────────────┬──────────────────┬──────────────┐');
  console.log('  │ Email                                       │ Password         │ Role         │');
  console.log('  ├─────────────────────────────────────────────┼──────────────────┼──────────────┤');
  console.log('  │ superadmin@smartstore.com  (default login)  │ SuperAdmin123!   │ SUPER_ADMIN  │');
  console.log('  │ admin@smartstore.com                        │ Demo1234!        │ TENANT_ADMIN │');
  console.log('  │ manager@smartstore.com                      │ Demo1234!        │ STAFF        │');
  console.log('  │ staff@smartstore.com                        │ Demo1234!        │ STAFF        │');
  console.log('  │ admin@techsolutions.lk                      │ Demo1234!        │ TENANT_ADMIN │');
  console.log('  └─────────────────────────────────────────────┴──────────────────┴──────────────┘');
  console.log('');
  console.log('  📦  5 Products');
  console.log('  👥  3 Customers');
  console.log('  🏪  1 Warehouse');
  console.log('  🚚  2 Couriers');
  console.log('  🛒  4 Orders with items');
  console.log('  💳  3 Payments');
  console.log('  📬  2 Deliveries');
  console.log('  🎁  3 Customer loyalty records');
  console.log('  🏭  1 Supplier');
  console.log('  💎  1 Subscription (PRO plan)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
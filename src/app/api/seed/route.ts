import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seeding via API...');

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
        settings: {
          description: 'Demo organization for SmartStore SaaS platform',
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

    const organization2 = await prisma.organization.upsert({
      where: { id: 'org-2' },
      update: {},
      create: {
        id: 'org-2',
        name: 'Tech Solutions Ltd',
        domain: 'techsolutions.lk',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        settings: {
          description: 'Technology solutions provider',
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
            analytics: true,
            loyaltyProgram: true,
            socialCommerce: false,
            notifications: true,
            wishlist: true,
            coupons: true,
            aiInsights: true,
            bulkOperations: true,
            multiLanguage: false,
          },
        },
      },
    });

    // Create users
    const hashedPassword = await hash('password123', 12);

    const user1 = await prisma.user.upsert({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        email: 'admin@smartstore.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization1.id,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    const user2 = await prisma.user.upsert({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        email: 'manager@smartstore.com',
        name: 'Manager User',
        password: hashedPassword,
        role: 'STAFF',
        organizationId: organization1.id,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    // Create customers
    const customer1 = await prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: {
        id: 'customer-1',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+94 77 123 4567',
        organizationId: organization1.id,
        address: {
          street: '789 Customer Street',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00300',
        },
        status: 'ACTIVE',
        totalOrders: 0,
        totalSpent: 0,
      },
    });

    const customer2 = await prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: {
        id: 'customer-2',
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+94 77 234 5678',
        organizationId: organization1.id,
        address: {
          street: '321 Customer Avenue',
          city: 'Galle',
          state: 'Southern Province',
          country: 'Sri Lanka',
          postalCode: '80000',
        },
        status: 'ACTIVE',
        totalOrders: 0,
        totalSpent: 0,
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
        organizationId: organization1.id,
        isActive: true,
      },
    });

    const category2 = await prisma.category.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        name: 'Clothing',
        description: 'Fashion and clothing items',
        organizationId: organization1.id,
        isActive: true,
      },
    });

    // Create products
    const product1 = await prisma.product.upsert({
      where: { id: 'prod-1' },
      update: {},
      create: {
        id: 'prod-1',
        name: 'Smartphone X1',
        description: 'Latest smartphone with advanced features',
        price: 75000,
        comparePrice: 85000,
        cost: 60000,
        sku: 'SPX1-001',
        organizationId: organization1.id,
        categoryId: category1.id,
        createdById: user1.id,
        status: 'ACTIVE',
        inventoryQuantity: 50,
        weight: 0.2,
        dimensions: {
          length: 15,
          width: 7,
          height: 0.8,
        },
        tags: ['smartphone', 'mobile', 'technology'],
      },
    });

    const product2 = await prisma.product.upsert({
      where: { id: 'prod-2' },
      update: {},
      create: {
        id: 'prod-2',
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt for everyday wear',
        price: 2500,
        comparePrice: 3000,
        cost: 1500,
        sku: 'CTS-001',
        organizationId: organization1.id,
        categoryId: category2.id,
        createdById: user1.id,
        status: 'ACTIVE',
        inventoryQuantity: 100,
        weight: 0.1,
        dimensions: {
          length: 30,
          width: 25,
          height: 0.5,
        },
        tags: ['clothing', 't-shirt', 'cotton'],
      },
    });

    // Create couriers
    const courier1 = await prisma.courier.upsert({
      where: { id: 'courier-1' },
      update: {},
      create: {
        id: 'courier-1',
        name: 'Domex Express',
        email: 'support@domex.lk',
        phone: '+94 11 500 5000',
        organizationId: organization1.id,
        status: 'ACTIVE',
        vehicleType: 'MOTORCYCLE',
        vehicleNumber: 'WP-ABC-1234',
        rating: 4.5,
        totalDeliveries: 150,
        isActive: true,
      },
    });

    const courier2 = await prisma.courier.upsert({
      where: { id: 'courier-2' },
      update: {},
      create: {
        id: 'courier-2',
        name: 'Pronto Lanka',
        email: 'support@pronto.lk',
        phone: '+94 11 600 6000',
        organizationId: organization1.id,
        status: 'ACTIVE',
        vehicleType: 'VAN',
        vehicleNumber: 'WP-XYZ-5678',
        rating: 4.2,
        totalDeliveries: 200,
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
        createdById: user1.id,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        total: 75000,
        subtotal: 75000,
        tax: 0,
        shipping: 0,
        discount: 0,
        notes: 'Customer requested express delivery',
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
        createdById: user1.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        total: 2700,
        subtotal: 2500,
        tax: 0,
        shipping: 200,
        discount: 0,
        notes: 'Regular delivery',
      },
    });

    // Create order items
    const orderItem1 = await prisma.orderItem.upsert({
      where: { id: 'order-item-1' },
      update: {},
      create: {
        id: 'order-item-1',
        orderId: order1.id,
        productId: product1.id,
        quantity: 1,
        price: 75000,
        total: 75000,
      },
    });

    const orderItem2 = await prisma.orderItem.upsert({
      where: { id: 'order-item-2' },
      update: {},
      create: {
        id: 'order-item-2',
        orderId: order2.id,
        productId: product2.id,
        quantity: 1,
        price: 2500,
        total: 2500,
      },
    });

    // Create payments
    const payment1 = await prisma.payment.upsert({
      where: { id: 'payment-1' },
      update: {},
      create: {
        id: 'payment-1',
        orderId: order1.id,
        organizationId: organization1.id,
        customerId: customer1.id,
        amount: 75000,
        currency: 'LKR',
        method: 'CREDIT_CARD',
        gateway: 'STRIPE',
        status: 'COMPLETED',
        transactionId: 'txn_123456789',
        metadata: {
          gatewayTransactionId: 'stripe_txn_123456789',
          processedAt: new Date().toISOString(),
        },
      },
    });

    // Create deliveries
    const delivery1 = await prisma.delivery.upsert({
      where: { id: 'delivery-1' },
      update: {},
      create: {
        id: 'delivery-1',
        orderId: order1.id,
        courierId: courier1.id,
        customerId: customer1.id,
        organizationId: organization1.id,
        status: 'IN_TRANSIT',
        trackingNumber: 'TRK123456789',
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        address: customer1.address,
        notes: 'Handle with care - fragile item',
      },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log(`Created ${2} organizations, ${2} users, ${2} customers, ${2} categories, ${2} products, ${2} couriers, ${2} orders, ${2} order items, ${1} payment, ${1} delivery`);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        organizations: 2,
        users: 2,
        customers: 2,
        categories: 2,
        products: 2,
        couriers: 2,
        orders: 2,
        orderItems: 2,
        payments: 1,
        deliveries: 1,
      },
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
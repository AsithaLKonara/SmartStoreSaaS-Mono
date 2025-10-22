import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced database seeding...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create Organizations
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        id: 'org-electronics-lk',
        name: 'TechHub Electronics',
        domain: 'techhub.lk',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          language: 'en',
          features: {
            analytics: true,
            ai: true,
            marketing: true,
            inventory: true
          }
        }
      }
    }),
    prisma.organization.create({
      data: {
        id: 'org-fashion-lk',
        name: 'Colombo Fashion House',
        domain: 'colombofashion.lk',
        plan: 'BASIC',
        status: 'ACTIVE',
        settings: {
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          language: 'en',
          features: {
            analytics: true,
            ai: false,
            marketing: true,
            inventory: true
          }
        }
      }
    }),
    prisma.organization.create({
      data: {
        id: 'org-grocery-lk',
        name: 'FreshMart Supermarket',
        domain: 'freshmart.lk',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        settings: {
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          language: 'en',
          features: {
            analytics: true,
            ai: true,
            marketing: true,
            inventory: true
          }
        }
      }
    })
  ]);

  console.log('✅ Created 3 organizations');

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-admin-techhub',
        email: 'admin@techhub.lk',
        name: 'Rajesh Perera',
        role: 'ADMIN',
        organizationId: 'org-electronics-lk',
        isActive: true,
        emailVerified: new Date()
      }
    }),
    prisma.user.create({
      data: {
        id: 'user-manager-fashion',
        email: 'manager@colombofashion.lk',
        name: 'Priya Fernando',
        role: 'STAFF',
        organizationId: 'org-fashion-lk',
        isActive: true,
        emailVerified: new Date()
      }
    }),
    prisma.user.create({
      data: {
        id: 'user-admin-freshmart',
        email: 'admin@freshmart.lk',
        name: 'Kumar Silva',
        role: 'ADMIN',
        organizationId: 'org-grocery-lk',
        isActive: true,
        emailVerified: new Date()
      }
    })
  ]);

  console.log('✅ Created 3 users');

  // Create Categories
  const categories = await Promise.all([
    // Electronics categories
    prisma.category.create({
      data: {
        name: 'Smartphones',
        description: 'Latest smartphones and accessories',
        organizationId: 'org-electronics-lk',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Laptops & Computers',
        description: 'Laptops, desktops, and computer accessories',
        organizationId: 'org-electronics-lk',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Home Appliances',
        description: 'Kitchen and home appliances',
        organizationId: 'org-electronics-lk',
        isActive: true
      }
    }),
    // Fashion categories
    prisma.category.create({
      data: {
        name: 'Men\'s Clothing',
        description: 'Men\'s shirts, pants, and accessories',
        organizationId: 'org-fashion-lk',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Women\'s Clothing',
        description: 'Women\'s dresses, tops, and accessories',
        organizationId: 'org-fashion-lk',
        isActive: true
      }
    }),
    // Grocery categories
    prisma.category.create({
      data: {
        name: 'Fresh Produce',
        description: 'Fresh fruits and vegetables',
        organizationId: 'org-grocery-lk',
        isActive: true
      }
    }),
    prisma.category.create({
      data: {
        name: 'Dairy Products',
        description: 'Milk, cheese, and dairy products',
        organizationId: 'org-grocery-lk',
        isActive: true
      }
    })
  ]);

  console.log('✅ Created 7 categories');

  // Create Products
  const products = await Promise.all([
    // Electronics products
    prisma.product.create({
      data: {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Latest flagship smartphone with advanced camera system',
        sku: 'SAMSUNG-S24U-256',
        price: 450000,
        comparePrice: 480000,
        cost: 380000,
        organizationId: 'org-electronics-lk',
        categoryId: categories[0].id,
        createdById: 'user-admin-techhub',
        status: 'ACTIVE',
        inventoryQuantity: 25,
        weight: 0.232,
        tags: ['smartphone', 'samsung', 'flagship', 'camera'],
        dimensions: { length: 16.2, width: 7.9, height: 0.8 }
      }
    }),
    prisma.product.create({
      data: {
        name: 'iPhone 15 Pro Max',
        description: 'Apple\'s latest flagship with titanium design',
        sku: 'APPLE-IP15PM-256',
        price: 520000,
        comparePrice: 550000,
        cost: 450000,
        organizationId: 'org-electronics-lk',
        categoryId: categories[0].id,
        createdById: 'user-admin-techhub',
        status: 'ACTIVE',
        inventoryQuantity: 18,
        weight: 0.221,
        tags: ['iphone', 'apple', 'flagship', 'titanium'],
        dimensions: { length: 15.9, width: 7.7, height: 0.8 }
      }
    }),
    prisma.product.create({
      data: {
        name: 'MacBook Pro M3 14-inch',
        description: 'Powerful laptop for professionals and creators',
        sku: 'APPLE-MBP-M3-14',
        price: 850000,
        comparePrice: 900000,
        cost: 750000,
        organizationId: 'org-electronics-lk',
        categoryId: categories[1].id,
        createdById: 'user-admin-techhub',
        status: 'ACTIVE',
        inventoryQuantity: 12,
        weight: 1.6,
        tags: ['macbook', 'apple', 'laptop', 'professional'],
        dimensions: { length: 31.3, width: 22.1, height: 1.6 }
      }
    }),
    prisma.product.create({
      data: {
        name: 'LG Smart Refrigerator 500L',
        description: 'Energy-efficient smart refrigerator with WiFi connectivity',
        sku: 'LG-FRIDGE-500L',
        price: 320000,
        comparePrice: 350000,
        cost: 280000,
        organizationId: 'org-electronics-lk',
        categoryId: categories[2].id,
        createdById: 'user-admin-techhub',
        status: 'ACTIVE',
        inventoryQuantity: 8,
        weight: 85,
        tags: ['refrigerator', 'smart', 'lg', 'energy-efficient'],
        dimensions: { length: 60, width: 65, height: 180 }
      }
    }),
    // Fashion products
    prisma.product.create({
      data: {
        name: 'Men\'s Cotton Dress Shirt',
        description: 'Premium cotton dress shirt for formal occasions',
        sku: 'MENS-SHIRT-COTTON',
        price: 4500,
        comparePrice: 5000,
        cost: 3200,
        organizationId: 'org-fashion-lk',
        categoryId: categories[3].id,
        createdById: 'user-manager-fashion',
        status: 'ACTIVE',
        inventoryQuantity: 50,
        weight: 0.3,
        tags: ['shirt', 'cotton', 'formal', 'men'],
        dimensions: { length: 30, width: 20, height: 2 }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Women\'s Silk Saree',
        description: 'Elegant silk saree perfect for special occasions',
        sku: 'WOMENS-SAREE-SILK',
        price: 25000,
        comparePrice: 28000,
        cost: 18000,
        organizationId: 'org-fashion-lk',
        categoryId: categories[4].id,
        createdById: 'user-manager-fashion',
        status: 'ACTIVE',
        inventoryQuantity: 30,
        weight: 0.5,
        tags: ['saree', 'silk', 'traditional', 'women'],
        dimensions: { length: 120, width: 45, height: 1 }
      }
    }),
    // Grocery products
    prisma.product.create({
      data: {
        name: 'Fresh King Coconut',
        description: 'Fresh king coconut water - natural hydration',
        sku: 'COCONUT-KING-FRESH',
        price: 150,
        comparePrice: 180,
        cost: 100,
        organizationId: 'org-grocery-lk',
        categoryId: categories[5].id,
        createdById: 'user-admin-freshmart',
        status: 'ACTIVE',
        inventoryQuantity: 200,
        weight: 1.5,
        tags: ['coconut', 'fresh', 'natural', 'hydration'],
        dimensions: { length: 15, width: 12, height: 20 }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Highland Fresh Milk 1L',
        description: 'Fresh pasteurized milk from local dairy farms',
        sku: 'MILK-HIGHLAND-1L',
        price: 180,
        comparePrice: 200,
        cost: 150,
        organizationId: 'org-grocery-lk',
        categoryId: categories[6].id,
        createdById: 'user-admin-freshmart',
        status: 'ACTIVE',
        inventoryQuantity: 150,
        weight: 1.03,
        tags: ['milk', 'fresh', 'dairy', 'local'],
        dimensions: { length: 8, width: 8, height: 20 }
      }
    })
  ]);

  console.log('✅ Created 8 products');

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        email: 'nimal.perera@gmail.com',
        name: 'Nimal Perera',
        phone: '+94771234567',
        address: {
          street: '123 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
          country: 'Sri Lanka'
        },
        organizationId: 'org-electronics-lk',
        status: 'ACTIVE',
        totalOrders: 5,
        totalSpent: 125000
      }
    }),
    prisma.customer.create({
      data: {
        email: 'kamala.fernando@yahoo.com',
        name: 'Kamala Fernando',
        phone: '+94772345678',
        address: {
          street: '456 Kandy Road',
          city: 'Kandy',
          district: 'Kandy',
          postalCode: '20000',
          country: 'Sri Lanka'
        },
        organizationId: 'org-fashion-lk',
        status: 'ACTIVE',
        totalOrders: 3,
        totalSpent: 45000
      }
    }),
    prisma.customer.create({
      data: {
        email: 'sunil.jayawardena@outlook.com',
        name: 'Sunil Jayawardena',
        phone: '+94773456789',
        address: {
          street: '789 Negombo Road',
          city: 'Negombo',
          district: 'Gampaha',
          postalCode: '11500',
          country: 'Sri Lanka'
        },
        organizationId: 'org-grocery-lk',
        status: 'ACTIVE',
        totalOrders: 8,
        totalSpent: 12000
      }
    }),
    prisma.customer.create({
      data: {
        email: 'anuradha.wickramasinghe@gmail.com',
        name: 'Anuradha Wickramasinghe',
        phone: '+94774567890',
        address: {
          street: '321 Matara Road',
          city: 'Matara',
          district: 'Matara',
          postalCode: '81000',
          country: 'Sri Lanka'
        },
        organizationId: 'org-electronics-lk',
        status: 'ACTIVE',
        totalOrders: 2,
        totalSpent: 850000
      }
    }),
    prisma.customer.create({
      data: {
        email: 'dilani.ratnayake@yahoo.com',
        name: 'Dilani Ratnayake',
        phone: '+94775678901',
        address: {
          street: '654 Jaffna Road',
          city: 'Jaffna',
          district: 'Jaffna',
          postalCode: '40000',
          country: 'Sri Lanka'
        },
        organizationId: 'org-fashion-lk',
        status: 'ACTIVE',
        totalOrders: 4,
        totalSpent: 35000
      }
    })
  ]);

  console.log('✅ Created 5 customers');

  // Create Orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-001',
        status: 'DELIVERED',
        total: 450000,
        subtotal: 450000,
        tax: 0,
        shipping: 0,
        discount: 0,
        organizationId: 'org-electronics-lk',
        customerId: customers[0].id,
        createdById: 'user-admin-techhub',
        paymentStatus: 'PAID',
        shippingStatus: 'DELIVERED',
        notes: 'Customer requested express delivery'
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-002',
        status: 'SHIPPED',
        total: 25000,
        subtotal: 25000,
        tax: 0,
        shipping: 500,
        discount: 0,
        organizationId: 'org-fashion-lk',
        customerId: customers[1].id,
        createdById: 'user-manager-fashion',
        paymentStatus: 'PAID',
        shippingStatus: 'SHIPPED',
        notes: 'Gift wrapping requested'
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-003',
        status: 'PENDING',
        total: 850000,
        subtotal: 850000,
        tax: 0,
        shipping: 0,
        discount: 50000,
        organizationId: 'org-electronics-lk',
        customerId: customers[3].id,
        createdById: 'user-admin-techhub',
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING',
        notes: 'Corporate purchase - bulk discount applied'
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-004',
        status: 'CONFIRMED',
        total: 1800,
        subtotal: 1500,
        tax: 0,
        shipping: 300,
        discount: 0,
        organizationId: 'org-grocery-lk',
        customerId: customers[2].id,
        createdById: 'user-admin-freshmart',
        paymentStatus: 'PAID',
        shippingStatus: 'PENDING',
        notes: 'Regular customer - priority processing'
      }
    })
  ]);

  console.log('✅ Created 4 orders');

  // Create Order Items
  const orderItems = await Promise.all([
    prisma.orderItem.create({
      data: {
        quantity: 1,
        price: 450000,
        total: 450000,
        orderId: orders[0].id,
        productId: products[0].id
      }
    }),
    prisma.orderItem.create({
      data: {
        quantity: 1,
        price: 25000,
        total: 25000,
        orderId: orders[1].id,
        productId: products[5].id
      }
    }),
    prisma.orderItem.create({
      data: {
        quantity: 1,
        price: 850000,
        total: 850000,
        orderId: orders[2].id,
        productId: products[2].id
      }
    }),
    prisma.orderItem.create({
      data: {
        quantity: 10,
        price: 150,
        total: 1500,
        orderId: orders[3].id,
        productId: products[6].id
      }
    })
  ]);

  console.log('✅ Created 4 order items');

  // Create Payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        amount: 450000,
        currency: 'LKR',
        status: 'COMPLETED',
        method: 'CREDIT_CARD',
        transactionId: 'stripe_txn_001',
        orderId: orders[0].id,
        customerId: customers[0].id,
        organizationId: 'org-electronics-lk',
        gateway: 'STRIPE',
        metadata: {
          gatewayResponse: 'Payment processed successfully',
          processedAt: new Date().toISOString()
        }
      }
    }),
    prisma.payment.create({
      data: {
        amount: 25000,
        currency: 'LKR',
        status: 'COMPLETED',
        method: 'BANK_TRANSFER',
        transactionId: 'payhere_txn_002',
        orderId: orders[1].id,
        customerId: customers[1].id,
        organizationId: 'org-fashion-lk',
        gateway: 'PAYHERE',
        metadata: {
          gatewayResponse: 'PayHere payment successful',
          processedAt: new Date().toISOString()
        }
      }
    }),
    prisma.payment.create({
      data: {
        amount: 1800,
        currency: 'LKR',
        status: 'COMPLETED',
        method: 'BANK_TRANSFER',
        transactionId: 'cash_txn_003',
        orderId: orders[3].id,
        customerId: customers[2].id,
        organizationId: 'org-grocery-lk',
        gateway: 'CASH',
        metadata: {
          gatewayResponse: 'Cash payment received',
          processedAt: new Date().toISOString()
        }
      }
    })
  ]);

  console.log('✅ Created 3 payments');

  console.log('🎉 Enhanced database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('- 3 Organizations (TechHub Electronics, Colombo Fashion House, FreshMart Supermarket)');
  console.log('- 3 Users (Admins and Managers)');
  console.log('- 7 Categories (Electronics, Fashion, Grocery)');
  console.log('- 8 Products (Smartphones, Laptops, Clothing, Groceries)');
  console.log('- 5 Customers (Sri Lankan customers with local addresses)');
  console.log('- 4 Orders (Various statuses and payment methods)');
  console.log('- 4 Order Items');
  console.log('- 3 Payments (Stripe, PayHere, Cash)');
  console.log('');
  console.log('🚀 Your SmartStore SaaS is ready for an impressive client demo!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

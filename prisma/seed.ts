import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out in production)
  console.log('🧹 Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.customerConversation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organizations
  console.log('🏢 Creating organizations...');
  const demoOrg = await prisma.organization.create({
    data: {
      name: 'Demo Store',
      slug: 'demo-store',
      plan: 'PRO',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en',
        taxRate: 8.5,
        shippingMethods: ['standard', 'express', 'overnight'],
        paymentMethods: ['stripe', 'paypal', 'cash'],
        notifications: {
          email: true,
          sms: false,
          whatsapp: true
        }
      }
    }
  });

  const techOrg = await prisma.organization.create({
    data: {
      name: 'Tech Gadgets Pro',
      slug: 'tech-gadgets',
      plan: 'ENTERPRISE',
      settings: {
        currency: 'EUR',
        timezone: 'Europe/London',
        language: 'en',
        taxRate: 20.0,
        shippingMethods: ['standard', 'express', 'same-day'],
        paymentMethods: ['stripe', 'paypal', 'apple-pay', 'google-pay'],
        notifications: {
          email: true,
          sms: true,
          whatsapp: true
        }
      }
    }
  });

  const fashionOrg = await prisma.organization.create({
    data: {
      name: 'Fashion Boutique',
      slug: 'fashion-boutique',
      plan: 'STARTER',
      settings: {
        currency: 'GBP',
        timezone: 'Europe/London',
        language: 'en',
        taxRate: 0.0,
        shippingMethods: ['standard', 'express'],
        paymentMethods: ['stripe', 'paypal'],
        notifications: {
          email: true,
          sms: false,
          whatsapp: false
        }
      }
    }
  });

  // 2. Create Users (with hashed passwords)
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Admin Demo',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      mfaEnabled: false,
      mfaBackupCodes: [],
      organizationId: demoOrg.id
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@tech.com',
      name: 'Tech Manager',
      password: hashedPassword,
      role: 'MANAGER',
      isActive: true,
      mfaEnabled: false,
      mfaBackupCodes: [],
      organizationId: techOrg.id
    }
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@fashion.com',
      name: 'Fashion Staff',
      password: hashedPassword,
      role: 'STAFF',
      isActive: true,
      mfaEnabled: false,
      mfaBackupCodes: [],
      organizationId: fashionOrg.id
    }
  });

  // 3. Create Products
  console.log('📦 Creating products...');
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Premium Wood Watch',
        slug: 'premium-wood-watch',
        sku: 'WW-001',
        description: 'Handcrafted wooden watch with genuine leather strap. Perfect for both casual and formal occasions.',
        price: 89.99,
        stockQuantity: 25,
        images: ['/images/products/wood-watch-1.jpg', '/images/products/wood-watch-2.jpg', '/images/products/wood-watch-3.jpg'],
        isActive: true,
        organizationId: demoOrg.id,
        createdById: adminUser.id
      },
      {
        name: 'LED Name Board',
        slug: 'led-name-board',
        sku: 'LED-NB-001',
        description: 'Customizable LED name board with remote control. Perfect for home decoration and special occasions.',
        price: 149.99,
        stockQuantity: 15,
        images: ['/images/products/led-board-1.jpg', '/images/products/led-board-2.jpg'],
        isActive: true,
        organizationId: demoOrg.id,
        createdById: adminUser.id
      },
      {
        name: 'SmartPhone Pro Max',
        slug: 'smartphone-pro-max',
        sku: 'SP-PRO-001',
        description: 'Latest smartphone with 6.7-inch display, 256GB storage, and advanced camera system.',
        price: 999.99,
        stockQuantity: 50,
        images: ['/images/products/smartphone-1.jpg', '/images/products/smartphone-2.jpg', '/images/products/smartphone-3.jpg', '/images/products/smartphone-4.jpg'],
        isActive: true,
        organizationId: techOrg.id,
        createdById: managerUser.id
      },
      {
        name: 'UltraBook Laptop',
        slug: 'ultrabook-laptop',
        sku: 'UB-001',
        description: 'Lightweight laptop with 13-inch display, 16GB RAM, and 512GB SSD. Perfect for professionals.',
        price: 1299.99,
        stockQuantity: 30,
        images: ['/images/products/laptop-1.jpg', '/images/products/laptop-2.jpg'],
        isActive: true,
        organizationId: techOrg.id,
        createdById: managerUser.id
      },
      {
        name: 'Elegant Evening Dress',
        slug: 'elegant-evening-dress',
        sku: 'ED-001',
        description: 'Beautiful evening dress perfect for special occasions. Available in multiple colors and sizes.',
        price: 199.99,
        stockQuantity: 20,
        images: ['/images/products/dress-1.jpg', '/images/products/dress-2.jpg', '/images/products/dress-3.jpg'],
        isActive: true,
        organizationId: fashionOrg.id,
        createdById: staffUser.id
      },
      {
        name: 'Comfort Sneakers',
        slug: 'comfort-sneakers',
        sku: 'CS-001',
        description: 'Comfortable sneakers with memory foam insole. Perfect for daily wear and casual outings.',
        price: 79.99,
        stockQuantity: 40,
        images: ['/images/products/sneakers-1.jpg', '/images/products/sneakers-2.jpg'],
        isActive: true,
        organizationId: fashionOrg.id,
        createdById: staffUser.id
      }
    ]
  });

  // 4. Create Customers
  console.log('👤 Creating customers...');
  const customers = await prisma.customer.createMany({
    data: [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        organizationId: demoOrg.id,
        totalSpent: 0
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0124',
        organizationId: demoOrg.id,
        totalSpent: 0
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@example.com',
        phone: '+44-20-7946-0958',
        organizationId: techOrg.id,
        totalSpent: 0
      },
      {
        name: 'Sarah Jones',
        email: 'sarah.jones@example.com',
        phone: '+44-20-7946-0959',
        organizationId: fashionOrg.id,
        totalSpent: 0
      }
    ]
  });

  // 5. Create Orders
  console.log('🛒 Creating orders...');
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      customerId: 'cust_john_doe',
      organizationId: demoOrg.id,
      totalAmount: 239.98,
      subtotal: 239.98,
      tax: 0,
      shipping: 0,
      discount: 0,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      createdById: adminUser.id
    }
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      customerId: 'cust_mike_wilson',
      organizationId: techOrg.id,
      totalAmount: 999.99,
      subtotal: 999.99,
      tax: 0,
      shipping: 0,
      discount: 0,
      status: 'PENDING',
      paymentStatus: 'COMPLETED',
      createdById: managerUser.id
    }
  });

  // 6. Create Order Items
  console.log('📋 Creating order items...');
  await prisma.orderItem.createMany({
    data: [
      {
        productId: 'prod_wood_watch',
        quantity: 1,
        price: 89.99,
        total: 89.99,
        orderId: order1.id
      },
      {
        productId: 'prod_led_board',
        quantity: 1,
        price: 149.99,
        total: 149.99,
        orderId: order1.id
      },
      {
        productId: 'prod_smartphone',
        quantity: 1,
        price: 999.99,
        total: 999.99,
        orderId: order2.id
      }
    ]
  });

  // 7. Create Payments
  console.log('💳 Creating payments...');
  await prisma.payment.createMany({
    data: [
      {
        orderId: order1.id,
        amount: 239.98,
        currency: 'USD',
        status: 'COMPLETED',
        method: 'STRIPE',
        gateway: 'stripe',
        organizationId: demoOrg.id,
        metadata: {
          paymentMethod: 'card',
          last4: '4242'
        }
      },
      {
        orderId: order2.id,
        amount: 999.99,
        currency: 'EUR',
        status: 'COMPLETED',
        method: 'PAYPAL',
        gateway: 'paypal',
        organizationId: techOrg.id,
        metadata: {
          paymentMethod: 'paypal',
          email: 'mike.wilson@example.com'
        }
      }
    ]
  });

  // 8. Create Chat Conversations
  console.log('💬 Creating chat conversations...');
  const conversation1 = await prisma.customerConversation.create({
    data: {
      customerId: 'cust_john_doe',
      organizationId: demoOrg.id,
      status: 'active',
      channel: 'website',
      priority: 'medium',
      tags: ['support', 'product-question'],
      assignedAgentId: adminUser.id
    }
  });

  // 9. Create Chat Messages
  console.log('💭 Creating chat messages...');
  await prisma.chatMessage.createMany({
    data: [
      {
        content: 'Hi, I have a question about the wood watch. Is it waterproof?',
        type: 'TEXT',
        direction: 'INBOUND',
        status: 'READ',
        organizationId: demoOrg.id,
        customerId: 'cust_john_doe',
        assignedToId: adminUser.id
      },
      {
        content: 'Hello! The wood watch is water-resistant but not fully waterproof. It can handle light splashes but should not be submerged in water.',
        type: 'TEXT',
        direction: 'OUTBOUND',
        status: 'SENT',
        organizationId: demoOrg.id,
        customerId: 'cust_john_doe',
        assignedToId: adminUser.id
      }
    ]
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Seeded Data Summary:');
  console.log(`   - Organizations: 3`);
  console.log(`   - Users: 3`);
  console.log(`   - Products: 6`);
  console.log(`   - Customers: 4`);
  console.log(`   - Orders: 2`);
  console.log(`   - Payments: 2`);
  console.log(`   - Chat Conversations: 1`);
  console.log(`   - Chat Messages: 2`);
  console.log('\n🔑 Default Login Credentials:');
  console.log(`   - Demo Store: admin@demo.com / password123`);
  console.log(`   - Tech Gadgets: manager@tech.com / password123`);
  console.log(`   - Fashion Boutique: staff@fashion.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
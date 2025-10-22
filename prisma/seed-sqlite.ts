import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Organizations
  console.log('📊 Creating organizations...');
  const organizations = [];
  for (let i = 1; i <= 10; i++) {
    const org = await prisma.organization.create({
      data: {
        name: `Organization ${i}`,
        domain: i === 1 ? 'smartstore.example.com' : `org${i}.example.com`,
        description: `This is organization ${i} for testing purposes`,
        logo: `https://example.com/logo${i}.png`,
        status: i <= 8 ? 'ACTIVE' : 'INACTIVE',
        settings: JSON.stringify({
          theme: 'light',
          currency: 'LKR',
          timezone: 'Asia/Colombo'
        })
      }
    });
    organizations.push(org);
    console.log(`✅ Created organization: ${org.name}`);
  }

  // Create Users
  console.log('👥 Creating users...');
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        name: `User ${i}`,
        password: hashedPassword,
        role: i === 1 ? 'ADMIN' : i <= 3 ? 'MANAGER' : 'USER',
        organizationId: organizations[i - 1].id,
        isActive: true,
        emailVerified: new Date(),
        phone: `+9477123456${i.toString().padStart(2, '0')}`,
        mfaBackupCodes: JSON.stringify(['backup1', 'backup2', 'backup3'])
      }
    });
    users.push(user);
    console.log(`✅ Created user: ${user.email}`);
  }

  // Create Categories
  console.log('📂 Creating categories...');
  const categories = [];
  const categoryNames = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Automotive', 'Food', 'Health'];
  
  for (let i = 0; i < 10; i++) {
    const category = await prisma.category.create({
      data: {
        name: categoryNames[i],
        description: `${categoryNames[i]} category for e-commerce`,
        isActive: true
      }
    });
    categories.push(category);
    console.log(`✅ Created category: ${category.name}`);
  }

  // Create Products
  console.log('🛍️ Creating products...');
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `This is a sample product ${i} for testing`,
        sku: `SKU-${i.toString().padStart(3, '0')}`,
        price: Math.floor(Math.random() * 1000) + 100,
        cost: Math.floor(Math.random() * 500) + 50,
        stock: Math.floor(Math.random() * 100) + 10,
        minStock: 5,
        weight: Math.random() * 10,
        dimensions: JSON.stringify({
          length: Math.random() * 50,
          width: Math.random() * 30,
          height: Math.random() * 20
        }),
        tags: JSON.stringify([`tag${i}`, `category${i}`, 'sample']),
        organizationId: organizations[i - 1].id,
        categoryId: categories[i - 1].id,
        isActive: true
      }
    });
    products.push(product);
    console.log(`✅ Created product: ${product.name}`);
  }

  // Create Product Variants
  console.log('🔧 Creating product variants...');
  const variants = [];
  for (let i = 0; i < 10; i++) {
    const variant = await prisma.productVariant.create({
      data: {
        name: `Variant ${i + 1} for ${products[i].name}`,
        sku: `VAR-${(i + 1).toString().padStart(3, '0')}`,
        price: products[i].price + Math.floor(Math.random() * 100),
        cost: products[i].cost + Math.floor(Math.random() * 50),
        stock: Math.floor(Math.random() * 50) + 5,
        weight: products[i].weight + Math.random() * 5,
        dimensions: products[i].dimensions,
        productId: products[i].id,
        organizationId: products[i].organizationId,
        isActive: true
      }
    });
    variants.push(variant);
    console.log(`✅ Created variant: ${variant.name}`);
  }

  // Create Customers
  console.log('👤 Creating customers...');
  const customers = [];
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+9477123456${i.toString().padStart(2, '0')}`,
        address: JSON.stringify({
          street: `${i} Main Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        }),
        organizationId: organizations[i - 1].id
      }
    });
    customers.push(customer);
    console.log(`✅ Created customer: ${customer.name}`);
  }

  // Create Orders
  console.log('📦 Creating orders...');
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${i.toString().padStart(4, '0')}`,
        customerId: customers[i - 1].id,
        organizationId: organizations[i - 1].id,
        status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'][Math.floor(Math.random() * 5)],
        total: Math.floor(Math.random() * 5000) + 500,
        subtotal: Math.floor(Math.random() * 4000) + 400,
        tax: Math.floor(Math.random() * 500) + 50,
        shipping: Math.floor(Math.random() * 500) + 50,
        discount: Math.floor(Math.random() * 200),
        notes: `Order notes for order ${i}`
      }
    });
    orders.push(order);
    console.log(`✅ Created order: ${order.orderNumber}`);
  }

  // Create Order Items
  console.log('📋 Creating order items...');
  for (let i = 0; i < 10; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    await prisma.orderItem.create({
      data: {
        orderId: orders[i].id,
        productId: products[i].id,
        variantId: variants[i].id,
        quantity: quantity,
        price: products[i].price,
        total: products[i].price * quantity
      }
    });
    console.log(`✅ Created order item for order ${orders[i].orderNumber}`);
  }

  // Create Payments
  console.log('💳 Creating payments...');
  for (let i = 1; i <= 10; i++) {
    await prisma.payment.create({
      data: {
        orderId: orders[i - 1].id,
        organizationId: organizations[i - 1].id,
        amount: orders[i - 1].total,
        currency: 'LKR',
        method: ['CASH', 'CARD', 'BANK_TRANSFER', 'COD'][Math.floor(Math.random() * 4)],
        status: ['PENDING', 'COMPLETED', 'FAILED'][Math.floor(Math.random() * 3)],
        transactionId: `TXN-${i.toString().padStart(6, '0')}`,
        gateway: ['STRIPE', 'PAYPAL', 'CASH'][Math.floor(Math.random() * 3)],
        metadata: JSON.stringify({
          gatewayResponse: 'success',
          processingTime: Math.floor(Math.random() * 5000) + 1000
        })
      }
    });
    console.log(`✅ Created payment for order ${orders[i - 1].orderNumber}`);
  }

  // Create Couriers
  console.log('🚚 Creating couriers...');
  const couriers = [];
  for (let i = 1; i <= 10; i++) {
    const courier = await prisma.courier.create({
      data: {
        name: `Courier ${i}`,
        phone: `+9477123456${i.toString().padStart(2, '0')}`,
        email: `courier${i}@example.com`,
        organizationId: organizations[i - 1].id,
        isActive: true
      }
    });
    couriers.push(courier);
    console.log(`✅ Created courier: ${courier.name}`);
  }

  // Create Deliveries
  console.log('📮 Creating deliveries...');
  for (let i = 1; i <= 10; i++) {
    await prisma.delivery.create({
      data: {
        orderId: orders[i - 1].id,
        organizationId: organizations[i - 1].id,
        courierId: couriers[i - 1].id,
        status: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'][Math.floor(Math.random() * 5)],
        trackingNumber: `TRK-${i.toString().padStart(6, '0')}`,
        estimatedDelivery: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        customerId: customers[i - 1].id,
        address: customers[i - 1].address,
        notes: `Delivery notes for order ${orders[i - 1].orderNumber}`
      }
    });
    console.log(`✅ Created delivery for order ${orders[i - 1].orderNumber}`);
  }

  // Create Analytics
  console.log('📊 Creating analytics...');
  for (let i = 1; i <= 10; i++) {
    await prisma.analytics.create({
      data: {
        type: ['page_views', 'sales', 'users', 'orders'][Math.floor(Math.random() * 4)],
        value: Math.floor(Math.random() * 1000) + 100,
        metadata: JSON.stringify({
          source: 'web',
          timestamp: new Date().toISOString()
        }),
        organizationId: organizations[i - 1].id
      }
    });
    console.log(`✅ Created analytics record for organization ${i}`);
  }

  // Create Customer Loyalty
  console.log('🎯 Creating customer loyalty...');
  for (let i = 1; i <= 10; i++) {
    await prisma.customerLoyalty.create({
      data: {
        customerId: customers[i - 1].id,
        points: Math.floor(Math.random() * 1000) + 100,
        tier: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][Math.floor(Math.random() * 4)],
        totalSpent: Math.floor(Math.random() * 10000) + 1000,
        lastActivity: new Date()
      }
    });
    console.log(`✅ Created loyalty record for customer ${i}`);
  }

  // Create Wishlists
  console.log('❤️ Creating wishlists...');
  for (let i = 1; i <= 10; i++) {
    const wishlist = await prisma.wishlist.create({
      data: {
        customerId: customers[i - 1].id,
        name: `My Wishlist ${i}`,
        isPublic: Math.random() > 0.5
      }
    });
    
    // Add items to wishlist
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: products[i - 1].id,
        quantity: Math.floor(Math.random() * 3) + 1
      }
    });
    console.log(`✅ Created wishlist for customer ${i}`);
  }

  // Create Warehouses
  console.log('🏭 Creating warehouses...');
  for (let i = 1; i <= 10; i++) {
    await prisma.warehouse.create({
      data: {
        name: `Warehouse ${i}`,
        address: JSON.stringify({
          street: `${i} Warehouse Street`,
          city: 'Colombo',
          postalCode: `1${i}000`,
          country: 'Sri Lanka'
        }),
        organizationId: organizations[i - 1].id
      }
    });
    console.log(`✅ Created warehouse ${i}`);
  }

  // Create WooCommerce Integrations
  console.log('🔌 Creating WooCommerce integrations...');
  for (let i = 1; i <= 5; i++) {
    await prisma.wooCommerceIntegration.create({
      data: {
        organizationId: organizations[i - 1].id,
        storeUrl: `https://store${i}.example.com`,
        consumerKey: `ck_${Math.random().toString(36).substring(7)}`,
        consumerSecret: `cs_${Math.random().toString(36).substring(7)}`,
        isActive: true,
        lastSync: new Date(),
        syncSettings: JSON.stringify({
          syncProducts: true,
          syncOrders: true,
          syncCustomers: true
        })
      }
    });
    console.log(`✅ Created WooCommerce integration ${i}`);
  }

  // Create WhatsApp Integrations
  console.log('📱 Creating WhatsApp integrations...');
  for (let i = 1; i <= 5; i++) {
    await prisma.whatsAppIntegration.create({
      data: {
        organizationId: organizations[i - 1].id,
        phoneNumber: `+9477123456${i.toString().padStart(2, '0')}`,
        accessToken: `token_${Math.random().toString(36).substring(7)}`,
        isActive: true,
        lastSync: new Date(),
        syncSettings: JSON.stringify({
          autoReply: true,
          businessHours: '09:00-17:00',
          timezone: 'Asia/Colombo'
        })
      }
    });
    console.log(`✅ Created WhatsApp integration ${i}`);
  }

  // Create Social Commerce
  console.log('📱 Creating social commerce...');
  for (let i = 1; i <= 5; i++) {
    const socialCommerce = await prisma.socialCommerce.create({
      data: {
        platform: ['Facebook', 'Instagram', 'TikTok', 'Twitter', 'LinkedIn'][i - 1],
        organizationId: organizations[i - 1].id,
        isActive: true
      }
    });

    // Create social products
    await prisma.socialProduct.create({
      data: {
        socialCommerceId: socialCommerce.id,
        productId: products[i - 1].id,
        platformProductId: `platform_${i}_${Math.random().toString(36).substring(7)}`,
        isActive: true
      }
    });

    // Create social posts
    await prisma.socialPost.create({
      data: {
        socialCommerceId: socialCommerce.id,
        content: `Check out our amazing product ${i}! #smartstore #product${i}`,
        mediaUrls: JSON.stringify([`https://example.com/image${i}.jpg`]),
        isActive: true
      }
    });

    console.log(`✅ Created social commerce for platform ${socialCommerce.platform}`);
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${organizations.length} organizations`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${variants.length} product variants`);
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${orders.length} orders`);
  console.log(`   - ${couriers.length} couriers`);
  console.log(`   - And many more related records!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

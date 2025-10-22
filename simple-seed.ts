import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if data already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@techhub.lk' }
  });
  
  const existingProducts = await prisma.product.count();
  
  if (existingUser && existingProducts > 0) {
    console.log('✅ Data already seeded! Skipping...');
    console.log('\n📊 Database Status:');
    console.log(`   - Organizations: ${await prisma.organization.count()}`);
    console.log(`   - Users: ${await prisma.user.count()}`);
    console.log(`   - Products: ${existingProducts}`);
    console.log(`   - Customers: ${await prisma.customer.count()}`);
    console.log(`   - Orders: ${await prisma.order.count()}`);
    console.log('\n✅ You can login with:');
    console.log('   Email: admin@techhub.lk');
    console.log('   Password: demo123');
    return;
  }
  
  console.log('Starting fresh seed...');

  // Create or find Organization
  console.log('Setting up organization...');
  let organization = await prisma.organization.findFirst({
    where: { domain: 'techhub.lk' }
  });
  
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Tech Hub Lanka',
        domain: 'techhub.lk',
        description: 'Leading tech retailer in Sri Lanka',
        settings: JSON.stringify({
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          phone: '+94112345678',
          address: '456 Industrial Road, Colombo 10, Sri Lanka',
          features: {
            multiWarehouse: true,
            courier: true,
            accounting: true,
            analytics: true
          }
        }),
        status: 'ACTIVE'
      }
    });
    console.log(`✅ Organization created: ${organization.name}`);
  } else {
    console.log(`✅ Using existing organization: ${organization.name}`);
  }

  // Create or find Admin User
  console.log('Setting up admin user...');
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@techhub.lk' }
  });
  
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@techhub.lk',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id,
        emailVerified: new Date()
      }
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
  } else {
    console.log(`✅ Using existing admin user: ${adminUser.email}`);
  }

  // Create Categories
  console.log('Creating categories...');
  const electronicsCategory = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      isActive: true
    }
  });

  const clothingCategory = await prisma.category.create({
    data: {
      name: 'Clothing',
      description: 'Apparel and fashion items',
      isActive: true
    }
  });

  const homeCategory = await prisma.category.create({
    data: {
      name: 'Home & Garden',
      description: 'Home improvement and gardening products',
      isActive: true
    }
  });
  console.log('✅ Categories created');

  // Create Products
  console.log('Creating products...');
  const products = [];
  
  const product1 = await prisma.product.create({
    data: {
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
      sku: 'WBH-001',
      price: 15000,
      cost: 8000,
      stock: 50,
      minStock: 10,
      categoryId: electronicsCategory.id,
      organizationId: organization.id,
      isActive: true,
      weight: 0.3,
      dimensions: JSON.stringify({ length: 20, width: 18, height: 8 })
    }
  });
  products.push(product1);

  const product2 = await prisma.product.create({
    data: {
      name: 'Smart Watch Pro',
      description: 'Advanced fitness tracking smartwatch with heart rate monitor',
      sku: 'SWP-002',
      price: 25000,
      cost: 15000,
      stock: 30,
      minStock: 5,
      categoryId: electronicsCategory.id,
      organizationId: organization.id,
      isActive: true,
      weight: 0.15,
      dimensions: JSON.stringify({ length: 10, width: 10, height: 3 })
    }
  });
  products.push(product2);

  const product3 = await prisma.product.create({
    data: {
      name: 'Cotton T-Shirt',
      description: 'Premium quality 100% cotton t-shirt, available in multiple sizes',
      sku: 'CTS-003',
      price: 2500,
      cost: 1000,
      stock: 100,
      minStock: 20,
      categoryId: clothingCategory.id,
      organizationId: organization.id,
      isActive: true,
      weight: 0.2,
      dimensions: JSON.stringify({ length: 30, width: 25, height: 2 })
    }
  });
  products.push(product3);

  const product4 = await prisma.product.create({
    data: {
      name: 'Garden Tool Set',
      description: '10-piece professional gardening tool kit with carrying case',
      sku: 'GTS-004',
      price: 8500,
      cost: 4500,
      stock: 20,
      minStock: 8,
      categoryId: homeCategory.id,
      organizationId: organization.id,
      isActive: true,
      weight: 2.5,
      dimensions: JSON.stringify({ length: 50, width: 30, height: 15 })
    }
  });
  products.push(product4);

  const product5 = await prisma.product.create({
    data: {
      name: 'LED Desk Lamp',
      description: 'Adjustable LED desk lamp with USB charging port',
      sku: 'LDL-005',
      price: 4500,
      cost: 2200,
      stock: 45,
      minStock: 15,
      categoryId: homeCategory.id,
      organizationId: organization.id,
      isActive: true,
      weight: 0.8,
      dimensions: JSON.stringify({ length: 40, width: 20, height: 12 })
    }
  });
  products.push(product5);

  console.log(`✅ ${products.length} products created`);

  // Create Customers
  console.log('Creating customers...');
  const customers = [];

  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+94771234567',
      address: JSON.stringify({
        street: '45 Galle Road',
        city: 'Colombo',
        state: 'Western',
        country: 'Sri Lanka',
        postalCode: '00300'
      }),
      organizationId: organization.id
    }
  });
  customers.push(customer1);

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+94772345678',
      address: JSON.stringify({
        street: '78 Kandy Road',
        city: 'Kandy',
        state: 'Central',
        country: 'Sri Lanka',
        postalCode: '20000'
      }),
      organizationId: organization.id
    }
  });
  customers.push(customer2);

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      phone: '+94773456789',
      address: JSON.stringify({
        street: '12 Beach Road',
        city: 'Galle',
        state: 'Southern',
        country: 'Sri Lanka',
        postalCode: '80000'
      }),
      organizationId: organization.id
    }
  });
  customers.push(customer3);

  console.log(`✅ ${customers.length} customers created`);

  // Create Orders
  console.log('Creating orders...');
  
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-001',
      customerId: customer1.id,
      organizationId: organization.id,
      status: 'PENDING',
      subtotal: 40000,
      tax: 4000,
      shipping: 500,
      discount: 0,
      total: 44500
    }
  });

  // Create order items for order1
  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: product1.id,
      quantity: 2,
      price: 15000,
      total: 30000
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: product2.id,
      quantity: 1,
      price: 25000,
      total: 25000
    }
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-002',
      customerId: customer2.id,
      organizationId: organization.id,
      status: 'PROCESSING',
      subtotal: 11000,
      tax: 1100,
      shipping: 300,
      discount: 500,
      total: 11900
    }
  });

  // Create order items for order2
  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: product3.id,
      quantity: 3,
      price: 2500,
      total: 7500
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: product5.id,
      quantity: 1,
      price: 4500,
      total: 4500
    }
  });

  console.log('✅ Orders created');

  // Create Payments
  console.log('Creating payments...');
  await prisma.payment.create({
    data: {
      orderId: order2.id,
      organizationId: organization.id,
      amount: 11900,
      currency: 'LKR',
      method: 'CARD',
      status: 'COMPLETED',
      transactionId: 'TXN-' + Date.now(),
      gateway: 'Stripe',
      metadata: JSON.stringify({
        cardLast4: '4242',
        cardBrand: 'Visa'
      })
    }
  });
  console.log('✅ Payments created');

  // Create Warehouse
  console.log('Creating warehouse...');
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      address: '456 Industrial Road, Colombo 10, Sri Lanka',
      organizationId: organization.id
    }
  });
  console.log('✅ Warehouse created');

  // Create Couriers
  console.log('Creating couriers...');
  await prisma.courier.create({
    data: {
      name: 'DHL Express',
      phone: '+94112233445',
      email: 'dhl@courier.lk',
      organizationId: organization.id,
      isActive: true
    }
  });

  await prisma.courier.create({
    data: {
      name: 'Pronto Delivery',
      phone: '+94113344556',
      email: 'pronto@courier.lk',
      organizationId: organization.id,
      isActive: true
    }
  });
  console.log('✅ Couriers created');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Organization: 1`);
  console.log(`   - Users: 1 (admin@techhub.lk)`);
  console.log(`   - Categories: 3`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Orders: 2`);
  console.log(`   - Payments: 1`);
  console.log(`   - Warehouses: 1`);
  console.log(`   - Couriers: 2`);
  console.log('\n✅ You can now login with:');
  console.log('   Email: admin@techhub.lk');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


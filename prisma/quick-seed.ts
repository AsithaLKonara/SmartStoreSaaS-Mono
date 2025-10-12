import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'SmartStore Demo',
      domain: 'demo.smartstore.com',
      description: 'Demo Organization',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Organization created:', org.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartstore.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@smartstore.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create default category
  const category = await prisma.category.create({
    data: {
      name: 'General',
    },
  });

  console.log('✅ Category created');

  // Create 3 sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Laptop Pro 15"',
        description: 'Professional laptop for business',
        price: 1299.99,
        sku: 'LAP-PRO-15',
        categoryId: category.id,
        organizationId: org.id,
        stock: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 29.99,
        sku: 'MOU-WIR-01',
        categoryId: category.id,
        organizationId: org.id,
        stock: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'USB-C Cable 2m',
        description: 'High-speed USB-C cable',
        price: 12.99,
        sku: 'CAB-USC-2M',
        categoryId: category.id,
        organizationId: org.id,
        stock: 100,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create 2 sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St, New York, NY 10001',
        organizationId: org.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        address: '456 Oak Ave, Los Angeles, CA 90001',
        organizationId: org.id,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create sample warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      address: 'New York, NY',
      organizationId: org.id,
    },
  });

  console.log('✅ Warehouse created');

  // Create sample orders
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-0001',
      customerId: customers[0].id,
      organizationId: org.id,
      status: 'completed',
      totalAmount: 1342.97,
      shippingAddress: customers[0].address,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            price: products[0].price,
          },
          {
            productId: products[1].id,
            quantity: 1,
            price: products[1].price,
          },
        ],
      },
    },
  });

  console.log('✅ Sample order created');

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`   - Organizations: 1`);
  console.log(`   - Users: 1 (admin@smartstore.com / admin123)`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Orders: 1`);
  console.log(`   - Warehouses: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


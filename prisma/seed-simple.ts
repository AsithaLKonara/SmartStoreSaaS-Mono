import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seeding...');

  try {
    // Create a test organization
    console.log('📊 Creating test organization...');
    const organization = await prisma.organization.create({
      data: {
        name: 'SmartStore Test Organization',
        domain: 'test.smartstore.com',
        description: 'Test organization for development',
        status: 'ACTIVE',
        settings: JSON.stringify({
          theme: 'light',
          currency: 'LKR',
          timezone: 'Asia/Colombo'
        })
      }
    });
    console.log(`✅ Created organization: ${organization.name}`);

    // Create a test user
    console.log('👥 Creating test user...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@smartstore.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id,
        isActive: true,
        emailVerified: new Date(),
        phone: '+94771234567'
      }
    });
    console.log(`✅ Created user: ${user.email}`);

    // Create test categories
    console.log('📂 Creating categories...');
    const categories = [];
    const categoryNames = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'];
    
    for (const name of categoryNames) {
      const category = await prisma.category.create({
        data: {
          name: name,
          description: `${name} category`,
          isActive: true
        }
      });
      categories.push(category);
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create test products
    console.log('🛍️ Creating products...');
    const products = [];
    for (let i = 1; i <= 5; i++) {
      const product = await prisma.product.create({
        data: {
          name: `Test Product ${i}`,
          description: `This is test product ${i}`,
          sku: `TEST-${i.toString().padStart(3, '0')}`,
          price: 100 + (i * 50),
          cost: 50 + (i * 25),
          stock: 100,
          minStock: 10,
          weight: i * 0.5,
          organizationId: organization.id,
          categoryId: categories[i - 1]?.id,
          isActive: true
        }
      });
      products.push(product);
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create test customers
    console.log('👤 Creating customers...');
    const customers = [];
    for (let i = 1; i <= 5; i++) {
      const customer = await prisma.customer.create({
        data: {
          name: `Test Customer ${i}`,
          email: `customer${i}@test.com`,
          phone: `+9477123456${i}`,
          address: JSON.stringify({
            street: `${i} Test Street`,
            city: 'Colombo',
            country: 'Sri Lanka'
          }),
          organizationId: organization.id
        }
      });
      customers.push(customer);
      console.log(`✅ Created customer: ${customer.name}`);
    }

    // Create test orders
    console.log('📦 Creating orders...');
    const orders = [];
    for (let i = 1; i <= 5; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `TEST-ORD-${i.toString().padStart(3, '0')}`,
          customerId: customers[i - 1]?.id || '',
          organizationId: organization.id,
          status: 'PENDING',
          total: 500 + (i * 100),
          subtotal: 400 + (i * 80),
          tax: 50 + (i * 10),
          shipping: 50 + (i * 10),
          discount: 0
        }
      });
      orders.push(order);
      console.log(`✅ Created order: ${order.orderNumber}`);
    }

    // Create test couriers
    console.log('🚚 Creating couriers...');
    const courier = await prisma.courier.create({
      data: {
        name: 'Test Courier',
        phone: '+94771234567',
        email: 'courier@test.com',
        organizationId: organization.id,
        isActive: true
      }
    });
    console.log(`✅ Created courier: ${courier.name}`);

    // Create test analytics
    console.log('📊 Creating analytics...');
    await prisma.analytics.create({
      data: {
        type: 'page_views',
        value: 1000,
        metadata: JSON.stringify({
          source: 'web',
          timestamp: new Date().toISOString()
        }),
        organizationId: organization.id
      }
    });
    console.log(`✅ Created analytics record`);

    console.log('🎉 Simple database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 1 organization`);
    console.log(`   - 1 user (admin@smartstore.com / password123)`);
    console.log(`   - 5 categories`);
    console.log(`   - 5 products`);
    console.log(`   - 5 customers`);
    console.log(`   - 5 orders`);
    console.log(`   - 1 courier`);
    console.log(`   - 1 analytics record`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
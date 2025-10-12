import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default organization
  const organization = await prisma.organizations.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Default Organization',
      status: 'ACTIVE',
      settings: '{}',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ Organization created: ${organization.name}`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      organizationId: organization.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Books', description: 'Books and educational materials' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' }
  ];

  for (const categoryData of categories) {
    const category = await prisma.categories.create({
      data: {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: categoryData.name,
        description: categoryData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Category created: ${category.name}`);
  }

  // Create sample products
  const products = [
    {
      name: 'Laptop Computer',
      description: 'High-performance laptop for work and gaming',
      sku: 'LAPTOP-001',
      price: 999.99,
      cost: 700.00,
      categoryId: (await prisma.categories.findFirst({ where: { name: 'Electronics' } }))?.id
    },
    {
      name: 'T-Shirt',
      description: 'Comfortable cotton t-shirt',
      sku: 'TSHIRT-001',
      price: 19.99,
      cost: 10.00,
      categoryId: (await prisma.categories.findFirst({ where: { name: 'Clothing' } }))?.id
    },
    {
      name: 'Programming Book',
      description: 'Learn JavaScript programming',
      sku: 'BOOK-001',
      price: 49.99,
      cost: 25.00,
      categoryId: (await prisma.categories.findFirst({ where: { name: 'Books' } }))?.id
    }
  ];

  for (const productData of products) {
    if (productData.categoryId) {
      const product = await prisma.products.create({
        data: {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: productData.name,
          description: productData.description,
          sku: productData.sku,
          price: productData.price,
          cost: productData.cost,
          categoryId: productData.categoryId,
          organizationId: organization.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Product created: ${product.name}`);
    }
  }

  // Create sample customers
  const customers = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, State 12345'
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      address: '456 Oak Ave, City, State 67890'
    }
  ];

  for (const customerData of customers) {
    const customer = await prisma.customers.create({
      data: {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Customer created: ${customer.name}`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

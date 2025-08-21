import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random IDs
const generateId = () => faker.string.alphanumeric(24);

// Helper function to generate random ObjectId-like strings
const generateObjectId = () => faker.string.alphanumeric(24);

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Create 3 admin users
    console.log('👥 Creating admin users...');
    const adminUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@smartstore.ai' },
        update: {},
        create: {
          id: generateId(),
          email: 'admin@smartstore.ai',
          password: await bcrypt.hash('admin123', 12),
          name: 'Super Admin',
          role: 'ADMIN',
          isActive: true,
          mfaEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'admin2@smartstore.ai' },
        update: {},
        create: {
          id: generateId(),
          email: 'admin2@smartstore.ai',
          password: await bcrypt.hash('admin123', 12),
          name: 'Admin Manager',
          role: 'ADMIN',
          isActive: true,
          mfaEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'admin3@smartstore.ai' },
        update: {},
        create: {
          id: generateId(),
          email: 'admin3@smartstore.ai',
          password: await bcrypt.hash('admin123', 12),
          name: 'System Admin',
          role: 'ADMIN',
          isActive: true,
          mfaEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);

    console.log(`✅ Created ${adminUsers.length} admin users`);

    // Create organizations
    console.log('🏢 Creating organizations...');
    const organizations = [];
    for (let i = 0; i < 50; i++) {
      const org = await prisma.organization.create({
        data: {
          id: generateId(),
          name: faker.company.name(),
          domain: faker.internet.domainName(),
          plan: faker.helpers.arrayElement(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
          status: faker.helpers.arrayElement(['ACTIVE', 'SUSPENDED', 'CANCELLED']),
          settings: {},
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      organizations.push(org);
    }
    console.log(`✅ Created ${organizations.length} organizations`);

    // Create customers
    console.log('👤 Creating customers...');
    const customers = [];
    for (let i = 0; i < 50; i++) {
      const customer = await prisma.customer.create({
        data: {
          id: generateId(),
          email: faker.internet.email(),
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
          },
          organizationId: organizations[i % organizations.length].id,
          status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'BLOCKED']),
          totalOrders: faker.number.int({ min: 0, max: 100 }),
          totalSpent: parseFloat(faker.finance.amount({ min: 0, max: 10000, dec: 2 })),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // Create categories
    console.log('📂 Creating categories...');
    const categories = [];
    for (let i = 0; i < 50; i++) {
      const category = await prisma.category.create({
        data: {
          id: generateId(),
          name: faker.commerce.department(),
          description: faker.lorem.sentence(),
          organizationId: organizations[i % organizations.length].id,
          parentId: null,
          isActive: true,
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      categories.push(category);
    }
    console.log(`✅ Created ${categories.length} categories`);

    // Create products
    console.log('📦 Creating products...');
    const products = [];
    for (let i = 0; i < 50; i++) {
      const product = await prisma.product.create({
        data: {
          id: generateId(),
          name: faker.commerce.productName(),
          description: faker.lorem.paragraph(),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          price: parseFloat(faker.finance.amount({ min: 1, max: 1000, dec: 2 })),
          comparePrice: parseFloat(faker.finance.amount({ min: 1, max: 1200, dec: 2 })),
          cost: parseFloat(faker.finance.amount({ min: 0.5, max: 500, dec: 2 })),
          organizationId: organizations[i % organizations.length].id,
          categoryId: categories[i % categories.length].id,
          createdById: adminUsers[i % adminUsers.length].id,
          updatedById: adminUsers[i % adminUsers.length].id,
          status: faker.helpers.arrayElement(['ACTIVE', 'DRAFT', 'ARCHIVED']),
          inventoryQuantity: faker.number.int({ min: 0, max: 1000 }),
          weight: faker.number.float({ min: 0.1, max: 50, precision: 0.1 }),
          dimensions: {
            length: faker.number.float({ min: 1, max: 100, precision: 0.1 }),
            width: faker.number.float({ min: 1, max: 100, precision: 0.1 }),
            height: faker.number.float({ min: 1, max: 100, precision: 0.1 }),
          },
          tags: faker.helpers.arrayElements(['electronics', 'clothing', 'home', 'sports', 'books'], { min: 1, max: 3 }),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products`);

    // Create orders
    console.log('🛒 Creating orders...');
    const orders = [];
    for (let i = 0; i < 50; i++) {
      const order = await prisma.order.create({
        data: {
          id: generateId(),
          orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
          status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
          total: parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 })),
          subtotal: parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 })),
          tax: parseFloat(faker.finance.amount({ min: 0, max: 100, dec: 2 })),
          shipping: parseFloat(faker.finance.amount({ min: 0, max: 50, dec: 2 })),
          discount: parseFloat(faker.finance.amount({ min: 0, max: 100, dec: 2 })),
          organizationId: organizations[i % organizations.length].id,
          customerId: customers[i % customers.length].id,
          createdById: adminUsers[i % adminUsers.length].id,
          updatedById: adminUsers[i % adminUsers.length].id,
          paymentStatus: faker.helpers.arrayElement(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
          shippingStatus: faker.helpers.arrayElement(['PENDING', 'SHIPPED', 'DELIVERED']),
          notes: faker.lorem.sentence(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      orders.push(order);
    }
    console.log(`✅ Created ${orders.length} orders`);

    // Create order items
    console.log('📋 Creating order items...');
    const orderItems = [];
    for (let i = 0; i < 50; i++) {
      const orderItem = await prisma.orderItem.create({
        data: {
          id: generateId(),
          quantity: faker.number.int({ min: 1, max: 10 }),
          price: parseFloat(faker.finance.amount({ min: 1, max: 100, dec: 2 })),
          total: parseFloat(faker.finance.amount({ min: 1, max: 1000, dec: 2 })),
          orderId: orders[i % orders.length].id,
          productId: products[i % products.length].id,
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      orderItems.push(orderItem);
    }
    console.log(`✅ Created ${orderItems.length} order items`);

    // Create payments
    console.log('💳 Creating payments...');
    const payments = [];
    for (let i = 0; i < 50; i++) {
      const payment = await prisma.payment.create({
        data: {
          id: generateId(),
          amount: parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 })),
          currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP', 'JPY']),
          status: faker.helpers.arrayElement(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
          method: faker.helpers.arrayElement(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO']),
          organizationId: organizations[i % organizations.length].id,
          orderId: orders[i % orders.length].id,
          customerId: customers[i % customers.length].id,
          transactionId: faker.string.alphanumeric(16),
          gateway: faker.helpers.arrayElement(['STRIPE', 'PAYPAL', 'SQUARE']),
          metadata: {},
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      payments.push(payment);
    }
    console.log(`✅ Created ${payments.length} payments`);

    // Create inventory movements
    console.log('📦 Creating inventory movements...');
    const inventoryMovements = [];
    for (let i = 0; i < 50; i++) {
      const movement = await prisma.inventoryMovement.create({
        data: {
          id: generateId(),
          type: faker.helpers.arrayElement(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
          quantity: faker.number.int({ min: 1, max: 100 }),
          reason: faker.lorem.sentence(),
          organizationId: organizations[i % organizations.length].id,
          productId: products[i % products.length].id,
          orderId: orders[i % orders.length].id,
          notes: faker.lorem.sentence(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      inventoryMovements.push(movement);
    }
    console.log(`✅ Created ${inventoryMovements.length} inventory movements`);

    // Create warehouses
    console.log('🏭 Creating warehouses...');
    const warehouses = [];
    for (let i = 0; i < 50; i++) {
      const warehouse = await prisma.warehouse.create({
        data: {
          id: generateId(),
          name: faker.company.name() + ' Warehouse',
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
          },
          organizationId: organizations[i % organizations.length].id,
          isActive: true,
          capacity: faker.number.int({ min: 1000, max: 100000 }),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      warehouses.push(warehouse);
    }
    console.log(`✅ Created ${warehouses.length} warehouses`);

    // Create couriers
    console.log('🚚 Creating couriers...');
    const couriers = [];
    for (let i = 0; i < 50; i++) {
      const courier = await prisma.courier.create({
        data: {
          id: generateId(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          vehicleType: faker.helpers.arrayElement(['CAR', 'MOTORCYCLE', 'BICYCLE', 'TRUCK']),
          vehicleNumber: faker.vehicle.vin(),
          organizationId: organizations[i % organizations.length].id,
          status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'OFFLINE']),
          rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
          totalDeliveries: faker.number.int({ min: 0, max: 1000 }),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      couriers.push(courier);
    }
    console.log(`✅ Created ${couriers.length} couriers`);

    // Create deliveries
    console.log('📮 Creating deliveries...');
    const deliveries = [];
    for (let i = 0; i < 50; i++) {
      const delivery = await prisma.delivery.create({
        data: {
          id: generateId(),
          trackingNumber: faker.string.alphanumeric(12).toUpperCase(),
          status: faker.helpers.arrayElement(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']),
          estimatedDelivery: faker.date.future(),
          actualDelivery: faker.date.future(),
          organizationId: organizations[i % organizations.length].id,
          orderId: orders[i % orders.length].id,
          courierId: couriers[i % couriers.length].id,
          customerId: customers[i % customers.length].id,
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
          },
          notes: faker.lorem.sentence(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      deliveries.push(delivery);
    }
    console.log(`✅ Created ${deliveries.length} deliveries`);

    // Create campaigns
    console.log('📢 Creating campaigns...');
    const campaigns = [];
    for (let i = 0; i < 50; i++) {
      const campaign = await prisma.campaign.create({
        data: {
          id: generateId(),
          name: faker.commerce.productName() + ' Campaign',
          description: faker.lorem.paragraph(),
          type: faker.helpers.arrayElement(['EMAIL', 'SMS', 'SOCIAL_MEDIA', 'PUSH_NOTIFICATION']),
          status: faker.helpers.arrayElement(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED']),
          organizationId: organizations[i % organizations.length].id,
          startDate: faker.date.past(),
          endDate: faker.date.future(),
          budget: parseFloat(faker.finance.amount({ min: 100, max: 10000, dec: 2 })),
          targetAudience: faker.helpers.arrayElements(['NEW_CUSTOMERS', 'EXISTING_CUSTOMERS', 'VIP_CUSTOMERS'], { min: 1, max: 3 }),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      campaigns.push(campaign);
    }
    console.log(`✅ Created ${campaigns.length} campaigns`);

    // Create analytics
    console.log('📊 Creating analytics...');
    const analytics = [];
    for (let i = 0; i < 50; i++) {
      const analytic = await prisma.analytics.create({
        data: {
          id: generateId(),
          type: faker.helpers.arrayElement(['PAGE_VIEW', 'PRODUCT_VIEW', 'PURCHASE', 'CART_ADD']),
          value: faker.number.int({ min: 1, max: 1000 }),
          metadata: {
            page: faker.internet.url(),
            userAgent: faker.internet.userAgent(),
            ip: faker.internet.ip(),
          },
          organizationId: organizations[i % organizations.length].id,
          customerId: customers[i % customers.length].id,
          productId: products[i % products.length].id,
          orderId: orders[i % orders.length].id,
          timestamp: faker.date.past(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      analytics.push(analytic);
    }
    console.log(`✅ Created ${analytics.length} analytics records`);

    // Create reports
    console.log('📈 Creating reports...');
    const reports = [];
    for (let i = 0; i < 50; i++) {
      const report = await prisma.report.create({
        data: {
          id: generateId(),
          name: faker.commerce.productName() + ' Report',
          type: faker.helpers.arrayElement(['SALES', 'INVENTORY', 'CUSTOMER', 'FINANCIAL']),
          status: faker.helpers.arrayElement(['DRAFT', 'GENERATED', 'SCHEDULED']),
          organizationId: organizations[i % organizations.length].id,
          createdById: adminUsers[i % adminUsers.length].id,
          data: {},
          schedule: faker.helpers.arrayElement(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']),
          lastGenerated: faker.date.past(),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        },
      });
      reports.push(report);
    }
    console.log(`✅ Created ${reports.length} reports`);

    console.log('🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Admin Users: ${adminUsers.length}`);
    console.log(`   🏢 Organizations: ${organizations.length}`);
    console.log(`   👤 Customers: ${customers.length}`);
    console.log(`   📂 Categories: ${categories.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   🛒 Orders: ${orders.length}`);
    console.log(`   📋 Order Items: ${orderItems.length}`);
    console.log(`   💳 Payments: ${payments.length}`);
    console.log(`   📦 Inventory Movements: ${inventoryMovements.length}`);
    console.log(`   🏭 Warehouses: ${warehouses.length}`);
    console.log(`   🚚 Couriers: ${couriers.length}`);
    console.log(`   📮 Deliveries: ${deliveries.length}`);
    console.log(`   📢 Campaigns: ${campaigns.length}`);
    console.log(`   📊 Analytics: ${analytics.length}`);
    console.log(`   📈 Reports: ${reports.length}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

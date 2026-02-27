import { PrismaClient, UserRole, OrganizationStatus, ActionOrigin, PaymentStatus, OrderStatus, SupportStatus, SupportPriority, IoTStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MASSIVE relational database seeding...');

  // --- PASSWORDS ---
  const superAdminHash = await hash('SuperAdmin123!', 12);
  const demoHash = await hash('Demo1234!', 12);

  // --- 1. ORGANIZATIONS (Total 10) ---
  console.log('🏢 Seeding Organizations...');
  const organizations = [];

  // Keep existing orgs 1 and 2
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
    },
  });
  organizations.push(org1);

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
    },
  });
  organizations.push(org2);

  for (let i = 3; i <= 10; i++) {
    const org = await prisma.organization.create({
      data: {
        id: `org-${i}`,
        name: faker.company.name(),
        domain: faker.internet.domainName(),
        description: faker.company.catchPhrase(),
        status: 'ACTIVE',
        plan: faker.helpers.arrayElement(['FREE', 'BASIC', 'PRO', 'ENTERPRISE'] as any),
      },
    });
    organizations.push(org);
  }

  // --- 2. USERS (At least 10 per org) ---
  console.log('👤 Seeding Users...');
  const users: any[] = [];

  // Existing superadmin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smartstore.com' },
    update: { password: superAdminHash },
    create: {
      email: 'superadmin@smartstore.com',
      name: 'Super Admin',
      password: superAdminHash,
      role: 'SUPER_ADMIN',
      organizationId: null,
      isActive: true,
      emailVerified: new Date(),
    },
  });
  users.push(superAdmin);

  // Seed at least 10 users for each organization
  for (const org of organizations) {
    for (let i = 1; i <= 10; i++) {
      const email = i === 1 && org.id === 'org-1' ? 'admin@smartstore.com' :
        i === 1 && org.id === 'org-2' ? 'admin@techsolutions.lk' :
          faker.internet.email({ firstName: org.name.split(' ')[0], lastName: `user-${i}-${org.id.slice(-1)}` });

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: faker.person.fullName(),
          password: demoHash,
          role: i === 1 ? 'TENANT_ADMIN' : faker.helpers.arrayElement(['STAFF', 'CUSTOMER']),
          organizationId: org.id,
          isActive: true,
          emailVerified: new Date(),
        },
      });
      users.push(user);
    }
  }

  // --- 3. CATEGORIES & PRODUCTS ---
  console.log('📦 Seeding Categories & Products...');
  for (const org of organizations) {
    const categories = [];
    for (let i = 1; i <= 10; i++) {
      const cat = await prisma.category.create({
        data: {
          name: faker.commerce.department(),
          description: faker.commerce.productDescription(),
          organizationId: org.id,
          isActive: true,
        },
      });
      categories.push(cat);
    }

    for (const cat of categories) {
      for (let i = 1; i <= 5; i++) {
        await prisma.product.create({
          data: {
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            sku: faker.string.alphanumeric(10).toUpperCase(),
            price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
            cost: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
            stock: faker.number.int({ min: 0, max: 500 }),
            organizationId: org.id,
            categoryId: cat.id,
            isActive: true,
          },
        });
      }
    }
  }

  // --- 4. CUSTOMERS ---
  console.log('👥 Seeding Customers...');
  const allCustomers = [];
  for (const org of organizations) {
    for (let i = 1; i <= 15; i++) {
      const customer = await prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          organizationId: org.id,
          totalSpent: 0,
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            country: 'Sri Lanka',
          },
        },
      });
      allCustomers.push(customer);
    }
  }

  // --- 5. ORDERS, ITEMS, PAYMENTS ---
  console.log('🛒 Seeding Orders & Payments...');
  for (const customer of allCustomers) {
    const orgProducts = await prisma.product.findMany({
      where: { organizationId: customer.organizationId },
      take: 5
    });

    for (let i = 1; i <= 3; i++) {
      const subtotal = orgProducts.reduce((acc, p) => acc + Number(p.price), 0);
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
          customerId: customer.id,
          organizationId: customer.organizationId,
          status: faker.helpers.arrayElement(Object.values(OrderStatus)),
          total: subtotal,
          subtotal: subtotal,
          tax: subtotal * 0.1,
          shipping: 10,
          discount: 0,
        },
      });

      for (const product of orgProducts) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: faker.number.int({ min: 1, max: 3 }),
            price: product.price,
            total: Number(product.price) * 1,
          },
        });
      }

      await prisma.payment.create({
        data: {
          orderId: order.id,
          organizationId: customer.organizationId,
          amount: subtotal,
          method: faker.helpers.arrayElement(['CARD', 'CASH', 'BANK_TRANSFER']),
          status: faker.helpers.arrayElement(Object.values(PaymentStatus)),
          gateway: faker.helpers.arrayElement(['STRIPE', 'PAYPAL', 'PAYHERE', 'MANUAL']),
          transactionId: faker.string.uuid(),
        },
      });
    }
  }

  // --- 6. WAREHOUSES & IOT ---
  console.log('🏪 Seeding Warehouses & IoT...');
  for (const org of organizations) {
    for (let i = 1; i <= 5; i++) {
      const wh = await prisma.warehouse.create({
        data: {
          name: `${org.name} - Wh ${i}`,
          organizationId: org.id,
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
          },
        },
      });

      for (let j = 1; j <= 3; j++) {
        await prisma.iotDevice.create({
          data: {
            id: faker.string.uuid(),
            name: `Sensor ${wh.name} ${j}`,
            type: faker.helpers.arrayElement(['TEMPERATURE', 'HUMIDITY', 'MOTION']),
            location: 'Main Aisle',
            warehouseId: wh.id,
            macAddress: faker.internet.mac(),
            firmwareVersion: '1.0.0',
            status: faker.helpers.arrayElement(Object.values(IoTStatus)),
            organizationId: org.id,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  // --- 7. SUPPORT TICKETS ---
  console.log('🎫 Seeding Support Tickets...');
  for (const customer of allCustomers.slice(0, 50)) {
    for (let i = 1; i <= 2; i++) {
      await prisma.supportTicket.create({
        data: {
          id: faker.string.uuid(),
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          status: faker.helpers.arrayElement(Object.values(SupportStatus)),
          priority: faker.helpers.arrayElement(Object.values(SupportPriority)),
          organizationId: customer.organizationId,
          updatedAt: new Date(),
        },
      });

      await prisma.conversation.create({
        data: {
          id: faker.string.uuid(),
          type: 'SUPPORT',
          status: 'OPEN',
          organizationId: customer.organizationId,
          customerId: customer.id,
          updatedAt: new Date(),
        },
      });
    }
  }

  // --- 8. AUDIT LOGS & ANALYTICS ---
  console.log('📊 Seeding Audit Logs & Analytics...');
  for (const org of organizations) {
    for (let i = 1; i <= 20; i++) {
      await prisma.auditLog.create({
        data: {
          userId: users.find(u => u.organizationId === org.id)?.id || users[0].id,
          action: faker.helpers.arrayElement(['LOGIN', 'UPDATE_PRODUCT', 'CREATE_ORDER', 'DELETE_USER']),
          resource: 'System',
          resourceId: faker.string.uuid(),
          organizationId: org.id,
          details: { ip: faker.internet.ip() },
        },
      });

      await prisma.analytics.create({
        data: {
          type: faker.helpers.arrayElement(['PAGE_VIEW', 'PRODUCT_CLICK', 'CART_ADD', 'SEARCH']),
          value: faker.number.int({ min: 1, max: 100 }),
          organizationId: org.id,
          metadata: { path: '/dashboard' },
        },
      });
    }
  }

  // --- 9. SUPPLIERS ---
  console.log('🏭 Seeding Suppliers...');
  for (const org of organizations) {
    for (let i = 1; i <= 5; i++) {
      await prisma.supplier.create({
        data: {
          code: `SUP-${faker.string.alphanumeric(5).toUpperCase()}`,
          name: faker.company.name(),
          email: faker.internet.email(),
          organizationId: org.id,
          status: 'ACTIVE',
        },
      });
    }
  }

  // --- 10. POS ---
  console.log('🖥️ Seeding POS Terminals...');
  for (const org of organizations) {
    for (let i = 1; i <= 3; i++) {
      await prisma.posTerminal.create({
        data: {
          name: `Terminal ${i}`,
          location: 'Front Desk',
          organizationId: org.id,
        },
      });
    }
  }

  console.log('\n✅ MASSIVE seeding completed!');
  console.log('Total Orgs:', await prisma.organization.count());
  console.log('Total Users:', await prisma.user.count());
  console.log('Total Products:', await prisma.product.count());
  console.log('Total Orders:', await prisma.order.count());
  console.log('Total Customers:', await prisma.customer.count());
}

main()
  .catch((e) => {
    console.error('❌ Error during massive seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
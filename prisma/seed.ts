import {
  PrismaClient,
  UserRole,
  ActionOrigin,
  PaymentStatus,
  OrderStatus,
  SupportStatus,
  SupportPriority,
  IoTStatus,
  PlanType,
  SubscriptionStatus,
  SupplierStatus,
  PurchaseOrderStatus,
  ReturnStatus,
  RefundMethod,
  GiftCardStatus,
  GiftCardTransactionType,
  AffiliateStatus,
  CommissionStatus,
  ReferralStatus
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const isDev = process.env.NODE_ENV === 'development' || process.env.SEED_CLEAN === 'true';

  if (isDev) {
    console.log('🧹 Cleaning up database (DEV MODE)...');
    await prisma.auditLog.deleteMany();
    await prisma.analytics.deleteMany();
    // ... only clearing logs and volatile data if explicitly asked or in dev
  } else {
    console.log('🛡️  Production-safe seeding mode: Destructive clean-up skipped.');
  }

  console.log('🌱 Starting MASSIVE relational database seeding...');

  console.log('🌱 Starting MASSIVE relational database seeding...');

  const superAdminHash = await hash('SuperAdmin123!', 12);
  const demoHash = await hash('Demo1234!', 12);

  console.log('🏢 Seeding Organizations...');
  const orgIds = ['org-1', 'org-2', 'org-3']; // Reduced count for speed but deep
  const organizations = [];

  for (const id of orgIds) {
    const org = await prisma.organization.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: id === 'org-1' ? 'SmartStore Core Demo' : faker.company.name(),
        domain: id === 'org-1' ? 'smartstore-demo.com' : faker.internet.domainName(),
        plan: faker.helpers.arrayElement(Object.values(PlanType)),
        status: 'ACTIVE',
        description: faker.company.catchPhrase(),
      },
    });
    organizations.push(org);
  }

  console.log('👤 Seeding Users...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smartstore.com' },
    update: { password: superAdminHash },
    create: {
      email: 'superadmin@smartstore.com',
      name: 'Super Admin',
      password: superAdminHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  for (const org of organizations) {
    const adminEmail = org.id === 'org-1' ? 'admin@smartstore.com' : `admin@${org.domain}`;
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { organizationId: org.id },
      create: {
        email: adminEmail,
        name: `${org.name} Admin`,
        password: demoHash,
        role: 'TENANT_ADMIN',
        organization: { connect: { id: org.id } },
        isActive: true,
      },
    });

    const tags = ['inventory_manager', 'sales_executive'];
    for (const tag of tags) {
      const staffEmail = `${tag}@${org.domain}`;
      await prisma.user.upsert({
        where: { email: staffEmail },
        update: { organizationId: org.id, roleTag: tag },
        create: {
          email: staffEmail,
          name: faker.person.fullName(),
          password: demoHash,
          role: 'STAFF',
          organization: { connect: { id: org.id } },
          isActive: true,
          roleTag: tag
        },
      });
    }

    console.log(`📦 Seeding Catalog for ${org.name}...`);
    const category = await prisma.category.create({
      data: {
        name: faker.commerce.department(),
        organization: { connect: { id: org.id } },
      },
    });

    for (let j = 0; j < 5; j++) {
      const product = await prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          sku: `${org.id.toUpperCase()}-${faker.string.alphanumeric(8).toUpperCase()}`,
          price: 100,
          cost: 50,
          stock: 100,
          organization: { connect: { id: org.id } },
          category: { connect: { id: category.id } },
        },
      });

      await prisma.productVariant.create({
        data: {
          product: { connect: { id: product.id } },
          name: 'Default',
          sku: `${product.sku}-DEF`,
          price: 100,
          stock: 100,
          organizationId: org.id,
        }
      });
    }

    console.log(`🏦 Seeding Finance for ${org.name}...`);
    const coa = await prisma.chartOfAccount.create({
      data: {
        id: faker.string.uuid(),
        code: `100-${faker.string.alphanumeric(2)}`,
        name: 'Operating Account',
        accountType: 'ASSET',
        accountSubType: 'CASH',
        organization: { connect: { id: org.id } },
        updatedAt: new Date()
      }
    });

    console.log(`👥 Seeding Customers for ${org.name}...`);
    for (let k = 0; k < 5; k++) {
      const customer = await prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          organization: { connect: { id: org.id } },
        }
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${faker.string.alphanumeric(6).toUpperCase()}`,
          customer: { connect: { id: customer.id } },
          organization: { connect: { id: org.id } },
          status: OrderStatus.DELIVERED,
          total: 100,
          subtotal: 100,
        }
      });

      const firstProd = await prisma.product.findFirst({ where: { organizationId: org.id } });
      if (firstProd) {
        await prisma.orderItem.create({
          data: {
            order: { connect: { id: order.id } },
            product: { connect: { id: firstProd.id } },
            quantity: 1,
            price: 100,
            total: 100
          }
        });
      }

      await prisma.payment.create({
        data: {
          order: { connect: { id: order.id } },
          organization: { connect: { id: org.id } },
          amount: 100,
          method: 'CASH',
          status: PaymentStatus.PAID,
        }
      });
    }

    console.log(`🏭 Seeding Procurement for ${org.name}...`);
    const supplier = await prisma.supplier.create({
      data: {
        organization: { connect: { id: org.id } },
        code: `SUP-${faker.string.alphanumeric(4).toUpperCase()}`,
        name: faker.company.name(),
      }
    });

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-${faker.string.alphanumeric(6).toUpperCase()}`,
        organization: { connect: { id: org.id } },
        supplier: { connect: { id: supplier.id } },
        status: 'DRAFT',
        subtotal: 500,
        total: 500,
        creator: { connect: { id: admin.id } },
      }
    });
  }

  console.log('\n✅ COMPREHENSIVE seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during comprehensive seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
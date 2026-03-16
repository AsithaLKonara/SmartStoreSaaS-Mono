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
  console.log('🧹 Cleaning up database...');
  await prisma.auditLog.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.supportReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.iotAlert.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.iotDevice.deleteMany();
  await prisma.warehouseInventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.customerLoyalty.deleteMany();
  await prisma.customerSegmentCustomer.deleteMany();
  await prisma.customerSegment.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productActivity.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.socialProduct.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.socialCommerce.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.procurementInvoice.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.rFQItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.return.deleteMany();
  await prisma.giftCardTransaction.deleteMany();
  await prisma.giftCard.deleteMany();
  await prisma.affiliateCommission.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.ledger.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.taxRate.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });

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
    const admin = await prisma.user.create({
      data: {
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
      await prisma.user.create({
        data: {
          email: `${tag}@${org.domain}`,
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
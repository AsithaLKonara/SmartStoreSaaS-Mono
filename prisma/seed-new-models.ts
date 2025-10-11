/**
 * Seed data for new database models
 * - Suppliers
 * - Purchase Orders
 * - Returns
 * - Gift Cards
 * - Affiliates
 * - Referrals
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding new models...\n');

  // Get the first organization for testing
  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('No organization found. Please seed organizations first.');
  }

  const user = await prisma.user.findFirst({
    where: { organizationId: organization.id },
  });
  if (!user) {
    throw new Error('No user found. Please seed users first.');
  }

  const customer = await prisma.customer.findFirst({
    where: { organizationId: organization.id },
  });
  if (!customer) {
    throw new Error('No customer found. Please seed customers first.');
  }

  const product = await prisma.product.findFirst({
    where: { organizationId: organization.id },
  });
  if (!product) {
    throw new Error('No product found. Please seed products first.');
  }

  const order = await prisma.order.findFirst({
    where: { organizationId: organization.id },
  });

  console.log('📦 Seeding Suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        organizationId: organization.id,
        code: 'SUP001',
        name: 'Global Electronics Ltd',
        contactName: 'John Smith',
        email: 'john@globalelectronics.com',
        phone: '+1-555-0101',
        address: {
          street: '123 Business Park',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA',
        },
        paymentTerms: 'Net 30',
        currency: 'USD',
        taxId: 'TAX123456',
        status: 'ACTIVE',
        rating: 4.5,
        totalOrders: 0,
        totalSpent: 0,
        notes: 'Primary electronics supplier',
      },
    }),
    prisma.supplier.create({
      data: {
        organizationId: organization.id,
        code: 'SUP002',
        name: 'Fashion Wholesale Inc',
        contactName: 'Sarah Johnson',
        email: 'sarah@fashionwholesale.com',
        phone: '+1-555-0202',
        address: {
          street: '456 Fashion Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          country: 'USA',
        },
        paymentTerms: 'Net 45',
        currency: 'USD',
        status: 'ACTIVE',
        rating: 4.8,
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        organizationId: organization.id,
        code: 'SUP003',
        name: 'Lanka Traders',
        contactName: 'Rajitha Silva',
        email: 'rajitha@lankatraders.lk',
        phone: '+94-77-1234567',
        address: {
          street: '789 Galle Road',
          city: 'Colombo',
          zip: '00300',
          country: 'Sri Lanka',
        },
        paymentTerms: 'Net 30',
        currency: 'LKR',
        status: 'ACTIVE',
        rating: 4.2,
        totalOrders: 0,
        totalSpent: 0,
      },
    }),
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers\n`);

  console.log('📋 Seeding Purchase Orders...');
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      orderNumber: `PO-${Date.now()}`,
      organizationId: organization.id,
      supplierId: suppliers[0].id,
      status: 'DRAFT',
      subtotal: 5000,
      tax: 400,
      shipping: 100,
      total: 5500,
      currency: 'USD',
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: 'Initial stock order for Q4',
      createdById: user.id,
      items: {
        create: [
          {
            productId: product.id,
            quantity: 100,
            receivedQuantity: 0,
            unitPrice: 45,
            tax: 360,
            total: 4860,
            notes: 'Bulk order discount applied',
          },
        ],
      },
    },
  });
  console.log(`✅ Created 1 purchase order with items\n`);

  if (order) {
    console.log('🔄 Seeding Returns...');
    const returnRequest = await prisma.return.create({
      data: {
        returnNumber: `RET-${Date.now()}`,
        organizationId: organization.id,
        orderId: order.id,
        customerId: customer.id,
        reason: 'Product defective - screen not working',
        status: 'PENDING',
        restockFee: 0,
        notes: 'Customer reported issue within 7 days',
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              reason: 'Defective screen',
              condition: 'Damaged',
            },
          ],
        },
      },
    });
    console.log(`✅ Created 1 return request\n`);
  }

  console.log('🎁 Seeding Gift Cards...');
  const giftCards = await Promise.all([
    prisma.giftCard.create({
      data: {
        code: `GC-${Date.now()}-001`,
        organizationId: organization.id,
        initialValue: 100,
        currentValue: 100,
        currency: 'USD',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        issuedTo: 'John Doe',
        issuedToEmail: 'john@example.com',
        issuedById: user.id,
      },
    }),
    prisma.giftCard.create({
      data: {
        code: `GC-${Date.now()}-002`,
        organizationId: organization.id,
        initialValue: 50,
        currentValue: 35,
        currency: 'USD',
        status: 'ACTIVE',
        issuedTo: 'Jane Smith',
        issuedToEmail: 'jane@example.com',
        issuedById: user.id,
        transactions: {
          create: [
            {
              amount: -15,
              type: 'REDEMPTION',
              balance: 35,
              notes: 'Used for order payment',
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${giftCards.length} gift cards\n`);

  console.log('🤝 Seeding Affiliates...');
  const affiliates = await Promise.all([
    prisma.affiliate.create({
      data: {
        organizationId: organization.id,
        code: 'AFF001',
        name: 'Tech Review Blog',
        email: 'contact@techreviewblog.com',
        phone: '+1-555-9001',
        commissionRate: 10,
        status: 'ACTIVE',
        totalSales: 0,
        totalCommission: 0,
        paymentDetails: {
          method: 'bank_transfer',
          accountNumber: '****1234',
        },
        notes: 'Technology focused blog with 50K monthly visitors',
      },
    }),
    prisma.affiliate.create({
      data: {
        organizationId: organization.id,
        code: 'AFF002',
        name: 'Fashion Influencer Network',
        email: 'partners@fashioninfluencer.com',
        commissionRate: 15,
        status: 'ACTIVE',
        totalSales: 0,
        totalCommission: 0,
        paymentDetails: {
          method: 'paypal',
          email: 'payments@fashioninfluencer.com',
        },
      },
    }),
  ]);
  console.log(`✅ Created ${affiliates.length} affiliates\n`);

  console.log('🔗 Seeding Referrals...');
  const referral = await prisma.referral.create({
    data: {
      organizationId: organization.id,
      referrerId: customer.id,
      affiliateId: affiliates[0].id,
      code: `REF-${Date.now()}`,
      status: 'PENDING',
      rewardType: 'DISCOUNT',
      rewardValue: 10,
    },
  });
  console.log(`✅ Created 1 referral\n`);

  console.log('✅ All new models seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${suppliers.length} Suppliers`);
  console.log(`   - 1 Purchase Order`);
  console.log(`   - ${order ? '1' : '0'} Return`);
  console.log(`   - ${giftCards.length} Gift Cards`);
  console.log(`   - ${affiliates.length} Affiliates`);
  console.log(`   - 1 Referral`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding new models:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


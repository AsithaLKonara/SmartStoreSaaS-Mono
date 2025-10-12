import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 FINAL WORKING SEEDING - Using Actual Schema Fields');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let total = 0;

  // Get org and data
  const org: any = (await prisma.$queryRaw`SELECT id FROM organizations LIMIT 1`)[0];
  const customers: any[] = await prisma.$queryRaw`SELECT id, name FROM customers LIMIT 10`;
  const products: any[] = await prisma.$queryRaw`SELECT id, name FROM products LIMIT 10`;
  
  console.log(`✅ Org: ${org?.id}, Customers: ${customers.length}, Products: ${products.length}`);
  console.log('');

  // 1. CUSTOMER LOYALTY
  console.log('🎁 customer_loyalty...');
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  for (let i = 0; i < Math.min(10, customers.length); i++) {
    try {
      await prisma.customer_loyalty.create({
        data: {
          id: `cl-${Date.now()}-${i}`,
          customerId: customers[i].id,
          points: Math.floor(Math.random() * 5000),
          tier: tiers[i % 4],
          totalSpent: String(Math.floor(Math.random() * 100000))
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total} loyalty programs`);

  // 2. LOYALTY TRANSACTIONS
  console.log('💳 loyalty_transactions...');
  const lc = total;
  const loyalties: any[] = await prisma.$queryRaw`SELECT id FROM customer_loyalty LIMIT 10`;
  for (let i = 0; i < loyalties.length * 2; i++) {
    try {
      await prisma.loyalty_transactions.create({
        data: {
          id: `lt-${Date.now()}-${i}`,
          loyaltyId: loyalties[i % loyalties.length].id,
          points: Math.floor(Math.random() * 100) + 10,
          type: i % 2 === 0 ? 'EARNED' : 'REDEEMED',
          description: i % 2 === 0 ? 'Purchase' : 'Discount'
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - lc} loyalty transactions`);

  // 3. WISHLISTS
  console.log('❤️ wishlists...');
  const wc = total;
  for (let i = 0; i < Math.min(10, customers.length); i++) {
    try {
      await prisma.wishlists.create({
        data: {
          id: `wl-${Date.now()}-${i}`,
          customerId: customers[i].id,
          name: `${customers[i].name}'s Wishlist`
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - wc} wishlists`);

  // 4. WISHLIST ITEMS
  console.log('🛍️ wishlist_items...');
  const wic = total;
  const wishlists: any[] = await prisma.$queryRaw`SELECT id FROM wishlists LIMIT 10`;
  for (let w = 0; w < wishlists.length; w++) {
    for (let p = 0; p < Math.min(3, products.length); p++) {
      try {
        await prisma.wishlist_items.create({
          data: {
            id: `wi-${Date.now()}-${w}-${p}`,
            wishlistId: wishlists[w].id,
            productId: products[p].id
          }
        });
        total++;
      } catch(e) {}
    }
  }
  console.log(`✅ Created ${total - wic} wishlist items`);

  // 5. CUSTOMER SEGMENTS
  console.log('📊 customer_segments...');
  const csc = total;
  const names = ['VIP', 'Regular', 'New', 'High Value', 'Inactive', 'Frequent', 'Seasonal', 'Wholesale', 'Retail', 'Online'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.customer_segments.create({
        data: {
          id: `cs-${Date.now()}-${i}`,
          name: names[i],
          description: `${names[i]} customers`,
          criteria: JSON.stringify({ min: i + 1 }),
          organizationId: org.id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - csc} segments`);

  // 6. TAX RATES
  console.log('💰 tax_rates...');
  const tc = total;
  const taxes = [
    { name: 'VAT 15%', rate: 15, type: 'VAT' },
    { name: 'VAT 8%', rate: 8, type: 'VAT' },
    { name: 'VAT 0%', rate: 0, type: 'ZERO_RATED' },
    { name: 'Import 10%', rate: 10, type: 'IMPORT' },
    { name: 'Luxury 25%', rate: 25, type: 'LUXURY' },
    { name: 'Service 5%', rate: 5, type: 'SERVICE' },
    { name: 'Sales 7%', rate: 7, type: 'SALES' },
    { name: 'GST 18%', rate: 18, type: 'GST' },
    { name: 'Excise 12%', rate: 12, type: 'EXCISE' },
    { name: 'County 3%', rate: 3, type: 'LOCAL' }
  ];
  for (let i = 0; i < taxes.length; i++) {
    try {
      await prisma.tax_rates.create({
        data: {
          id: `tax-${Date.now()}-${i}`,
          name: taxes[i].name,
          rate: taxes[i].rate,
          type: taxes[i].type,
          organizationId: org.id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - tc} tax rates`);

  // 7. SUPPORT TICKETS
  console.log('🎫 support_tickets...');
  const stc = total;
  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.support_tickets.create({
        data: {
          id: `ticket-${Date.now()}-${i}`,
          ticketNumber: `TKT-${String(i + 1).padStart(5, '0')}`,
          subject: `Support Issue ${i + 1}`,
          description: `Customer needs help with issue ${i + 1}`,
          status: statuses[i % statuses.length],
          priority: priorities[i % priorities.length],
          customerId: customers[i % customers.length].id,
          organizationId: org.id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - stc} support tickets`);

  // 8. INTEGRATION LOGS
  console.log('📝 integration_logs...');
  const ilc = total;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.integration_logs.create({
        data: {
          id: `intlog-${Date.now()}-${i}`,
          type: ['woocommerce', 'whatsapp', 'stripe'][i % 3],
          action: ['sync', 'webhook'][i % 2],
          status: ['success', 'failed'][i % 2],
          message: `Integration ${i + 1}`,
          organizationId: org.id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - ilc} integration logs`);

  // 9. ACTIVITIES  
  console.log('📋 activities...');
  const ac = total;
  const users: any[] = await prisma.$queryRaw`SELECT id FROM users LIMIT 5`;
  const types = ['user_login', 'product_created', 'order_placed', 'customer_added'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.activities.create({
        data: {
          id: `act-${Date.now()}-${i}`,
          type: types[i % types.length],
          description: `Activity ${i + 1}`,
          userId: users[i % users.length]?.id,
          organizationId: org.id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - ac} activities`);

  // 10. IOT DEVICES
  console.log('📡 iot_devices...');
  const iotc = total;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.iot_devices.create({
        data: {
          id: `iot-${Date.now()}-${i}`,
          deviceId: `IOT-${String(i + 1).padStart(4, '0')}`,
          name: `Sensor ${i + 1}`,
          type: ['temperature', 'humidity', 'motion'][i % 3],
          status: 'active',
          organizationId: org.id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - iotc} IoT devices`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 SEEDING COMPLETE - Created ${total} NEW RECORDS!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


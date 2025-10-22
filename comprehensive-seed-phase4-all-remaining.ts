import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 PHASE 4: ALL REMAINING TABLES (Customer, Analytics, Accounting, Integrations)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let total = 0;

  const orgs = await prisma.Organization.findMany();
  const org = orgs[0];
  const customers = await prisma.Customer.findMany();
  const products = await prisma.Product.findMany();
  const orders = await prisma.Order.findMany();
  const users = await prisma.User.findMany();
  const warehouses = await prisma.Warehouse.findMany();
  const couriers = await prisma.Courier.findMany();

  // Get deliveries that exist
  const existingDeliveries = await prisma.Delivery.findMany();
  
  // 15. Deliveries (if not enough)
  console.log('🚚 Completing deliveries...');
  const delCount = existingDeliveries.length;
  for (let i = delCount; i < Math.min(50, orders.length); i++) {
    try {
      await prisma.Delivery.create({
        data: {
          orderId: orders[i].id,
          courierId: couriers[i % couriers.length].id,
          trackingNumber: `TRK-${Date.now()}-${i}`,
          status: 'PENDING',
          organizationId: orders[i].organizationId
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - delCount} more deliveries (total: ${delCount + total})`);

  // 16. CustomerLoyalty (30 records - 1 per customer)
  console.log('🎁 Creating customer loyalty...');
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const loyCount = total;
  for (const customer of customers) {
    try {
      await prisma.CustomerLoyalty.create({
        data: {
          customerId: customer.id,
          points: Math.floor(Math.random() * 5000),
          tier: tiers[Math.floor(Math.random() * 4)],
          totalSpent: String(Math.floor(Math.random() * 200000)),
          lifetimePoints: Math.floor(Math.random() * 10000)
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - loyCount} loyalty programs`);

  // 17. Analytics (30 records)
  console.log('📊 Creating analytics...');
  const analyticsCount = total;
  const metricTypes = ['REVENUE', 'ORDERS', 'CUSTOMERS', 'PRODUCTS', 'TRAFFIC'];
  for (let i = 0; i < 30; i++) {
    try {
      await prisma.Analytics.create({
        data: {
          type: metricTypes[i % metricTypes.length],
          value: Math.floor(Math.random() * 100000),
          metadata: JSON.stringify({ period: 'daily', date: new Date() }),
          organizationId: orgs[i % orgs.length].id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - analyticsCount} analytics`);

  // 18. Subscriptions (10 records - 1 per org)
  console.log('💳 Creating subscriptions...');
  const subCount = total;
  const planTypes = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const subStatuses = ['ACTIVE', 'CANCELLED', 'PAUSED', 'TRIAL'];
  
  for (let i = 0; i < orgs.length; i++) {
    try {
      await prisma.Subscription.create({
        data: {
          organizationId: orgs[i].id,
          planType: planTypes[i % planTypes.length],
          status: subStatuses[i % subStatuses.length],
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - subCount} subscriptions`);

  // 19. Wishlists (30 records)
  console.log('❤️ Creating wishlists...');
  const wishlistCount = total;
  for (const customer of customers) {
    try {
      await prisma.wishlists.create({
        data: {
          customerId: customer.id,
          name: `${customer.name}'s Wishlist`
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - wishlistCount} wishlists`);

  // 20. Wishlist Items (60 records)
  console.log('🛍️ Creating wishlist items...');
  const wishlists = await prisma.wishlists.findMany();
  const wiCount = total;
  for (const wishlist of wishlists) {
    for (let i = 0; i < 2; i++) {
      try {
        await prisma.wishlist_items.create({
          data: {
            wishlistId: wishlist.id,
            productId: products[Math.floor(Math.random() * products.length)].id
          }
        });
        total++;
      } catch(e) {}
    }
  }
  console.log(`✅ Created ${total - wiCount} wishlist items`);

  // 21. Reports (15 records)
  console.log('📄 Creating reports...');
  const reportCount = total;
  const reportTypes = ['SALES', 'INVENTORY', 'CUSTOMER', 'FINANCIAL', 'TAX'];
  for (let i = 0; i < 15; i++) {
    try {
      await prisma.Report.create({
        data: {
          name: `${reportTypes[i % reportTypes.length]} Report ${i + 1}`,
          type: reportTypes[i % reportTypes.length],
          data: JSON.stringify({ records: i + 1 }),
          organizationId: orgs[i % orgs.length].id,
          createdById: users[i % users.length].id
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${total - reportCount} reports`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ PHASE 4 COMPLETE: ${total} new records`);
  console.log(`Running total: ~${125 + 234 + 150 + total} records!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


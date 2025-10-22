import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 CLEANUP & RE-SEED Strategy');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const org: any = (await prisma.$queryRaw`SELECT id FROM organizations LIMIT 1`)[0];
  const customers: any[] = await prisma.$queryRaw`SELECT id, name FROM customers LIMIT 10`;
  const products: any[] = await prisma.$queryRaw`SELECT id, name FROM products LIMIT 10`;

  if (!org || customers.length === 0) {
    console.log('❌ Missing core data');
    return;
  }

  let total = 0;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. CUSTOMER LOYALTY - Delete and recreate
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🎁 Seeding customer_loyalty (with cleanup)...');
  try {
    // Delete existing
    await prisma.$executeRaw`DELETE FROM customer_loyalty WHERE "customerId" IN (SELECT id FROM customers LIMIT 10)`;
    
    // Create new
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    for (let i = 0; i < customers.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO customer_loyalty (id, "customerId", points, tier, "totalSpent", "createdAt", "updatedAt")
        VALUES (
          ${`cl-new-${i + 1}`},
          ${customers[i].id},
          ${Math.floor(Math.random() * 5000)},
          ${tiers[i % 4]},
          ${String(Math.floor(Math.random() * 100000))},
          NOW(),
          NOW()
        )
      `;
      total++;
    }
    console.log(`✅ Created ${total} loyalty programs`);
  } catch (e) {
    console.log(`⚠️ customer_loyalty error: ${(e as Error).message.split('\n')[0]}`);
  }

  // 2. WISHLISTS
  console.log('❤️ Seeding wishlists (with cleanup)...');
  const wc = total;
  try {
    await prisma.$executeRaw`DELETE FROM wishlist_items`;
    await prisma.$executeRaw`DELETE FROM wishlists WHERE "customerId" IN (SELECT id FROM customers LIMIT 10)`;
    
    for (let i = 0; i < Math.min(10, customers.length); i++) {
      await prisma.$executeRaw`
        INSERT INTO wishlists (id, "customerId", name, "createdAt", "updatedAt")
        VALUES (
          ${`wl-new-${i + 1}`},
          ${customers[i].id},
          ${`${customers[i].name}'s Wishlist`},
          NOW(),
          NOW()
        )
      `;
      total++;
    }
    console.log(`✅ Created ${total - wc} wishlists`);
  } catch (e) {
    console.log(`⚠️ wishlists error: ${(e as Error).message.split('\n')[0]}`);
  }

  // 3. WISHLIST ITEMS
  console.log('🛍️ Seeding wishlist_items...');
  const wic = total;
  try {
    const wishlists: any[] = await prisma.$queryRaw`SELECT id FROM wishlists LIMIT 10`;
    for (let w = 0; w < wishlists.length; w++) {
      for (let p = 0; p < Math.min(3, products.length); p++) {
        await prisma.$executeRaw`
          INSERT INTO wishlist_items (id, "wishlistId", "productId", "addedAt")
          VALUES (
            ${`wi-new-${w}-${p}`},
            ${wishlists[w].id},
            ${products[p].id},
            NOW()
          )
        `;
        total++;
      }
    }
    console.log(`✅ Created ${total - wic} wishlist items`);
  } catch (e) {
    console.log(`⚠️ wishlist_items error: ${(e as Error).message.split('\n')[0]}`);
  }

  // 4. TAX RATES
  console.log('💰 Seeding tax_rates (with cleanup)...');
  const taxc = total;
  try {
    await prisma.$executeRaw`DELETE FROM tax_transactions`;
    await prisma.$executeRaw`DELETE FROM tax_rates WHERE "organizationId" = ${org.id}`;
    
    const taxes = [
      { name: 'VAT 15%', rate: 15, type: 'VAT' },
      { name: 'VAT 8%', rate: 8, type: 'VAT' },
      { name: 'VAT 0%', rate: 0, type: 'ZERO_RATED' },
      { name: 'Import Tax 10%', rate: 10, type: 'IMPORT' },
      { name: 'Sales Tax 7%', rate: 7, type: 'SALES' },
    ];
    
    for (let i = 0; i < taxes.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO tax_rates (id, name, rate, type, "organizationId", "createdAt", "updatedAt")
        VALUES (
          ${`tax-new-${i + 1}`},
          ${taxes[i].name},
          ${taxes[i].rate},
          ${taxes[i].type},
          ${org.id},
          NOW(),
          NOW()
        )
      `;
      total++;
    }
    console.log(`✅ Created ${total - taxc} tax rates`);
  } catch (e) {
    console.log(`⚠️ tax_rates error: ${(e as Error).message.split('\n')[0]}`);
  }

  // 5. SUPPORT TICKETS
  console.log('🎫 Seeding support_tickets...');
  const stc = total;
  try {
    const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH'];
    
    for (let i = 0; i < 10; i++) {
      await prisma.$executeRaw`
        INSERT INTO support_tickets (
          id, "ticketNumber", subject, description, status, priority, 
          "customerId", "organizationId", "createdAt", "updatedAt"
        )
        VALUES (
          ${`st-new-${i + 1}`},
          ${'TKT-' + String(10000 + i)},
          ${'Issue: ' + (i + 1)},
          ${'Customer reported problem ' + (i + 1)},
          ${statuses[i % statuses.length]},
          ${priorities[i % priorities.length]},
          ${customers[i % customers.length].id},
          ${org.id},
          NOW(),
          NOW()
        )
      `;
      total++;
    }
    console.log(`✅ Created ${total - stc} support tickets`);
  } catch (e) {
    console.log(`⚠️ support_tickets error: ${(e as Error).message.split('\n')[0]}`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 CLEANUP & RE-SEED COMPLETE - Created ${total} records!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


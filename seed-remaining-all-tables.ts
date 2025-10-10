import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SEEDING ALL REMAINING TABLES - COMPREHENSIVE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let total = 0;

  // Wait a bit to ensure connection pool is available
  await new Promise(resolve => setTimeout(resolve, 5000));

  const orgs = await prisma.Organization.findMany({ take: 10 });
  const org = orgs[0];
  const customers = await prisma.Customer.findMany({ take: 30 });
  const products = await prisma.Product.findMany({ take: 50 });
  const orders = await prisma.Order.findMany({ take: 50 });
  const users = await prisma.User.findMany({ take: 20 });
  const warehouses = await prisma.Warehouse.findMany();

  console.log(`Working with: ${orgs.length} orgs, ${customers.length} customers, ${products.length} products`);
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER ENGAGEMENT TABLES
  // ═══════════════════════════════════════════════════════════════
  
  // CustomerLoyalty (30)
  console.log('🎁 customer_loyalty...');
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  for (let i = 0; i < customers.length; i++) {
    try {
      await prisma.CustomerLoyalty.create({
        data: {
          customerId: customers[i].id,
          points: Math.floor(Math.random() * 5000) + 100,
          tier: tiers[i % 4],
          totalSpent: String(Math.floor(Math.random() * 200000) + 5000),
          lifetimePoints: Math.floor(Math.random() * 10000)
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ ${total} loyalty programs`);

  // loyalty_transactions (60)
  const loyalties = await prisma.CustomerLoyalty.findMany();
  console.log('💳 loyalty_transactions...');
  const ltStart = total;
  for (const loyalty of loyalties) {
    for (let i = 0; i < 2; i++) {
      try {
        await prisma.loyalty_transactions.create({
          data: {
            loyaltyId: loyalty.id,
            points: Math.floor(Math.random() * 200) + 10,
            type: i === 0 ? 'EARNED' : 'REDEEMED',
            description: i === 0 ? 'Purchase reward' : 'Discount used'
          }
        });
        total++;
      } catch(e) {}
    }
  }
  console.log(`✅ ${total - ltStart} loyalty transactions`);

  // wishlists (30)
  console.log('❤️ wishlists...');
  const wlStart = total;
  for (const customer of customers) {
    try {
      await prisma.wishlists.create({
        data: {
          customerId: customer.id,
          name: `${customer.name}'s Wishlist`,
          isPublic: false
        }
      });
      total++;
    } catch(e) {}
  }
  console.log(`✅ ${total - wlStart} wishlists`);

  // wishlist_items (60)
  const wishlists = await prisma.wishlists.findMany();
  console.log('🛍️ wishlist_items...');
  const wiStart = total;
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
  console.log(`✅ ${total - wiStart} wishlist items`);

  // customer_segments (10)
  console.log('📊 customer_segments...');
  const csStart = total;
  const segmentNames = ['VIP', 'Regular', 'New', 'High Value', 'Inactive', 
                        'Frequent', 'Seasonal', 'Wholesale', 'Retail', 'Online'];
  const segments = [];
  for (let i = 0; i < 10; i++) {
    try {
      const seg = await prisma.customer_segments.create({
        data: {
          name: segmentNames[i],
          description: `${segmentNames[i]} customer segment`,
          criteria: JSON.stringify({ minOrders: i + 1, minSpend: (i + 1) * 10000 }),
          organizationId: org.id
        }
      });
      segments.push(seg);
      total++;
    } catch(e) {}
  }
  console.log(`✅ ${total - csStart} customer segments`);

  // customer_segment_customers (30)
  console.log('🔗 customer_segment_customers...');
  const cscStart = total;
  for (let i = 0; i < segments.length; i++) {
    for (let c = 0; c < 3; c++) {
      try {
        await prisma.customer_segment_customers.create({
          data: {
            segmentId: segments[i].id,
            customerId: customers[c + i * 3 % customers.length].id
          }
        });
        total++;
      } catch(e) {}
    }
  }
  console.log(`✅ ${total - cscStart} segment mappings`);

  console.log('');
  console.log(`📊 Customer Engagement Complete: ${total} records`);
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // ACCOUNTING & FINANCE TABLES  
  // ═══════════════════════════════════════════════════════════════
  
  // chart_of_accounts (20)
  console.log('📒 chart_of_accounts...');
  const coaStart = total;
  const accountDefs = [
    { code: '1000', name: 'Cash', type: 'ASSET', sub: 'CURRENT_ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', sub: 'CURRENT_ASSET' },
    { code: '1200', name: 'Inventory', type: 'ASSET', sub: 'CURRENT_ASSET' },
    { code: '1300', name: 'Prepaid', type: 'ASSET', sub: 'CURRENT_ASSET' },
    { code: '1500', name: 'Equipment', type: 'ASSET', sub: 'FIXED_ASSET' },
    { code: '1600', name: 'Buildings', type: 'ASSET', sub: 'FIXED_ASSET' },
    { code: '1700', name: 'Land', type: 'ASSET', sub: 'FIXED_ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', sub: 'CURRENT_LIABILITY' },
    { code: '2100', name: 'Loans Payable', type: 'LIABILITY', sub: 'LONG_TERM_LIABILITY' },
    { code: '2200', name: 'Mortgage', type: 'LIABILITY', sub: 'LONG_TERM_LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY', sub: 'CAPITAL' },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', sub: 'RETAINED_EARNINGS' },
    { code: '4000', name: 'Sales', type: 'REVENUE', sub: 'OPERATING_REVENUE' },
    { code: '4100', name: 'Services', type: 'REVENUE', sub: 'OPERATING_REVENUE' },
    { code: '4200', name: 'Interest Income', type: 'REVENUE', sub: 'NON_OPERATING_REVENUE' },
    { code: '5000', name: 'COGS', type: 'EXPENSE', sub: 'COST_OF_SALES' },
    { code: '6100', name: 'Rent', type: 'EXPENSE', sub: 'OPERATING_EXPENSE' },
    { code: '6200', name: 'Utilities', type: 'EXPENSE', sub: 'OPERATING_EXPENSE' },
    { code: '6300', name: 'Salaries', type: 'EXPENSE', sub: 'OPERATING_EXPENSE' },
    { code: '6400', name: 'Marketing', type: 'EXPENSE', sub: 'OPERATING_EXPENSE' }
  ];

  const chartAccounts = [];
  for (const acc of accountDefs) {
    try {
      const created = await prisma.chart_of_accounts.create({
        data: {
          organizationId: org.id,
          code: acc.code,
          name: acc.name,
          accountType: acc.type,
          accountSubType: acc.sub,
          balance: Math.floor(Math.random() * 500000)
        }
      });
      chartAccounts.push(created);
      total++;
    } catch(e) {}
  }
  console.log(`✅ ${total - coaStart} accounts`);

  // tax_rates (15)
  console.log('💰 tax_rates...');
  const trStart = total;
  const taxDefs = [
    { name: 'VAT 15%', rate: 15, type: 'VAT' },
    { name: 'VAT 8%', rate: 8, type: 'VAT' },
    { name: 'VAT 0%', rate: 0, type: 'ZERO_RATED' },
    { name: 'Import 10%', rate: 10, type: 'IMPORT' },
    { name: 'Luxury 25%', rate: 25, type: 'LUXURY' },
    { name: 'Service 5%', rate: 5, type: 'SERVICE' },
    { name: 'Sales 7%', rate: 7, type: 'SALES' },
    { name: 'GST 18%', rate: 18, type: 'GST' },
    { name: 'Excise 12%', rate: 12, type: 'EXCISE' },
    { name: 'County 3%', rate: 3, type: 'LOCAL' },
    { name: 'Entertainment 15%', rate: 15, type: 'ENTERTAINMENT' },
    { name: 'Property 1.5%', rate: 1.5, type: 'PROPERTY' },
    { name: 'Stamp 2%', rate: 2, type: 'STAMP_DUTY' },
    { name: 'Withholding 5%', rate: 5, type: 'WITHHOLDING' },
    { name: 'Corporate 28%', rate: 28, type: 'CORPORATE' }
  ];

  const taxRates = [];
  for (const tax of taxDefs) {
    try {
      const rate = await prisma.tax_rates.create({
        data: {
          name: tax.name,
          rate: tax.rate,
          type: tax.type,
          organizationId: org.id
        }
      });
      taxRates.push(rate);
      total++;
    } catch(e) {}
  }
  console.log(`✅ ${total - trStart} tax rates`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ REMAINING TABLES SEEDED: ${total} new records`);
  console.log(`GRAND TOTAL: ~${545 + total} records across database!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


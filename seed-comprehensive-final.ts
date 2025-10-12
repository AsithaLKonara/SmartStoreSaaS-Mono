import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 COMPREHENSIVE SEEDING - ALL TABLES WITH ACTUAL SCHEMA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Get existing data using raw queries
  const orgs: any[] = await prisma.$queryRaw`SELECT id, name FROM organizations LIMIT 1`;
  const org = orgs[0];
  
  const products: any[] = await prisma.$queryRaw`SELECT id, name, sku, price, "organizationId" FROM products LIMIT 10`;
  const customers: any[] = await prisma.$queryRaw`SELECT id, name, email, "organizationId" FROM customers LIMIT 10`;
  const users: any[] = await prisma.$queryRaw`SELECT id, name, email FROM users LIMIT 5`;

  if (!org) {
    console.log('❌ No organization found!');
    return;
  }

  console.log(`✅ Found organization: ${org.name}`);
  console.log(`✅ Found ${products.length} products, ${customers.length} customers`);
  console.log('');

  let totalCreated = 0;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. CUSTOMER LOYALTY (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🎁 Seeding customer_loyalty...');
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  let loyaltyCount = 0;
  for (let i = 0; i < Math.min(10, customers.length); i++) {
    try {
      await prisma.customer_loyalty.create({
        data: {
          id: `loyalty-${i + 1}`,
          customerId: customers[i].id,
          points: Math.floor(Math.random() * 5000) + 100,
          tier: tiers[i % tiers.length],
          totalSpent: String(Math.floor(Math.random() * 100000) + 5000)
        }
      });
      loyaltyCount++;
    } catch (e) { console.log(`  ⚠️ Loyalty ${i + 1}: ${e instanceof Error ? e.message.split('\n')[0] : 'error'}`); }
  }
  console.log(`✅ Created ${loyaltyCount} loyalty programs`);
  totalCreated += loyaltyCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. LOYALTY TRANSACTIONS (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('💳 Seeding loyalty_transactions...');
  const loyalties: any[] = await prisma.$queryRaw`SELECT id FROM customer_loyalty LIMIT 10`;
  let loyaltyTxCount = 0;
  for (let i = 0; i < Math.min(20, loyalties.length * 2); i++) {
    try {
      await prisma.loyalty_transactions.create({
        data: {
          id: `ltx-${i + 1}`,
          loyaltyId: loyalties[i % loyalties.length].id,
          points: Math.floor(Math.random() * 200) + 10,
          type: i % 2 === 0 ? 'EARNED' : 'REDEEMED',
          description: i % 2 === 0 ? 'Purchase reward' : 'Discount redeemed'
        }
      });
      loyaltyTxCount++;
    } catch (e) { console.log(`  ⚠️ Transaction ${i + 1}: error`); }
  }
  console.log(`✅ Created ${loyaltyTxCount} loyalty transactions`);
  totalCreated += loyaltyTxCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. WISHLISTS (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('❤️ Seeding wishlists...');
  let wishlistCount = 0;
  for (let i = 0; i < Math.min(10, customers.length); i++) {
    try {
      await prisma.wishlists.create({
        data: {
          id: `wishlist-${i + 1}`,
          customerId: customers[i].id,
          name: `${customers[i].name}'s Wishlist`
        }
      });
      wishlistCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${wishlistCount} wishlists`);
  totalCreated += wishlistCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. WISHLIST ITEMS (20 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🛍️ Seeding wishlist_items...');
  const wishlists: any[] = await prisma.$queryRaw`SELECT id FROM wishlists LIMIT 10`;
  let wishlistItemCount = 0;
  for (let i = 0; i < wishlists.length; i++) {
    for (let p = 0; p < Math.min(3, products.length); p++) {
      try {
        await prisma.wishlist_items.create({
          data: {
            id: `wi-${i}-${p}`,
            wishlistId: wishlists[i].id,
            productId: products[p].id
          }
        });
        wishlistItemCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${wishlistItemCount} wishlist items`);
  totalCreated += wishlistItemCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. CUSTOMER SEGMENTS (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📊 Seeding customer_segments...');
  const segmentNames = ['VIP', 'Regular', 'New', 'High Value', 'Inactive', 
                        'Frequent', 'Seasonal', 'Wholesale', 'Retail', 'Online'];
  let segmentCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.customer_segments.create({
        data: {
          id: `segment-${i + 1}`,
          name: segmentNames[i],
          description: `${segmentNames[i]} customers`,
          criteria: JSON.stringify({ minPurchases: i + 1 }),
          organizationId: org.id
        }
      });
      segmentCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${segmentCount} customer segments`);
  totalCreated += segmentCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. CUSTOMER SEGMENT MAPPING (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🔗 Seeding customer_segment_customers...');
  const segments: any[] = await prisma.$queryRaw`SELECT id FROM customer_segments LIMIT 10`;
  let segmentMapCount = 0;
  for (let i = 0; i < Math.min(15, segments.length * 2); i++) {
    try {
      await prisma.customer_segment_customers.create({
        data: {
          id: `csm-${i + 1}`,
          segmentId: segments[i % segments.length].id,
          customerId: customers[i % customers.length].id
        }
      });
      segmentMapCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${segmentMapCount} segment mappings`);
  totalCreated += segmentMapCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. TAX RATES (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('💰 Seeding tax_rates...');
  const taxNames = ['VAT 15%', 'VAT 8%', 'VAT 0%', 'Import 10%', 'Luxury 25%', 
                    'Service 5%', 'Sales 7%', 'GST 18%', 'Excise 12%', 'County 3%'];
  const taxValues = [15, 8, 0, 10, 25, 5, 7, 18, 12, 3];
  let taxCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.tax_rates.create({
        data: {
          id: `tax-${i + 1}`,
          name: taxNames[i],
          rate: taxValues[i],
          type: i < 3 ? 'VAT' : 'OTHER',
          organizationId: org.id
        }
      });
      taxCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${taxCount} tax rates`);
  totalCreated += taxCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. CHART OF ACCOUNTS (12 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📒 Seeding chart_of_accounts...');
  const accounts = [
    { code: '1000', name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' },
    { code: '1200', name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET' },
    { code: '1500', name: 'Equipment', type: 'ASSET', subType: 'FIXED_ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
    { code: '2100', name: 'Loans', type: 'LIABILITY', subType: 'LONG_TERM_LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY', subType: 'CAPITAL' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: 'OPERATING_REVENUE' },
    { code: '4100', name: 'Service Revenue', type: 'REVENUE', subType: 'OPERATING_REVENUE' },
    { code: '5000', name: 'COGS', type: 'EXPENSE', subType: 'COST_OF_SALES' },
    { code: '6100', name: 'Rent', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
    { code: '6200', name: 'Utilities', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' }
  ];
  
  let accountCount = 0;
  for (const acc of accounts) {
    try {
      await prisma.chart_of_accounts.create({
        data: {
          id: `acc-${acc.code}`,
          organizationId: org.id,
          code: acc.code,
          name: acc.name,
          accountType: acc.type,
          accountSubType: acc.subType,
          balance: Math.floor(Math.random() * 500000)
        }
      });
      accountCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${accountCount} chart of accounts`);
  totalCreated += accountCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. JOURNAL ENTRIES (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📝 Seeding journal_entries...');
  let journalCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.journal_entries.create({
        data: {
          id: `je-${i + 1}`,
          entryNumber: `JE-${String(i + 1).padStart(5, '0')}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          description: `Journal Entry ${i + 1}`,
          organizationId: org.id
        }
      });
      journalCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${journalCount} journal entries`);
  totalCreated += journalCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. JOURNAL ENTRY LINES (20 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 Seeding journal_entry_lines...');
  const journalEntries: any[] = await prisma.$queryRaw`SELECT id FROM journal_entries LIMIT 10`;
  const chartAccounts: any[] = await prisma.$queryRaw`SELECT id FROM chart_of_accounts LIMIT 10`;
  let lineCount = 0;
  for (const je of journalEntries) {
    if (chartAccounts.length >= 2) {
      const amount = Math.floor(Math.random() * 50000) + 1000;
      try {
        await prisma.journal_entry_lines.create({
          data: {
            id: `jel-${lineCount}-1`,
            journalEntryId: je.id,
            accountId: chartAccounts[0].id,
            debit: amount,
            credit: 0
          }
        });
        await prisma.journal_entry_lines.create({
          data: {
            id: `jel-${lineCount}-2`,
            journalEntryId: je.id,
            accountId: chartAccounts[1].id,
            debit: 0,
            credit: amount
          }
        });
        lineCount += 2;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${lineCount} journal entry lines`);
  totalCreated += lineCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11. LEDGER (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📊 Seeding ledger...');
  let ledgerCount = 0;
  for (let i = 0; i < Math.min(20, chartAccounts.length * 2); i++) {
    try {
      await prisma.ledger.create({
        data: {
          id: `ledger-${i + 1}`,
          accountId: chartAccounts[i % chartAccounts.length].id,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          description: `Transaction ${i + 1}`,
          debit: i % 2 === 0 ? Math.floor(Math.random() * 10000) : 0,
          credit: i % 2 === 1 ? Math.floor(Math.random() * 10000) : 0,
          balance: Math.floor(Math.random() * 100000),
          organizationId: org.id
        }
      });
      ledgerCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${ledgerCount} ledger entries`);
  totalCreated += ledgerCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 12. TAX TRANSACTIONS (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('💵 Seeding tax_transactions...');
  const orders: any[] = await prisma.$queryRaw`SELECT id FROM orders LIMIT 10`;
  const taxRates: any[] = await prisma.$queryRaw`SELECT id FROM tax_rates LIMIT 10`;
  let taxTxCount = 0;
  for (let i = 0; i < Math.min(10, orders.length); i++) {
    if (taxRates.length > 0) {
      try {
        await prisma.tax_transactions.create({
          data: {
            id: `taxtx-${i + 1}`,
            orderId: orders[i].id,
            taxRateId: taxRates[i % taxRates.length].id,
            taxableAmount: Math.floor(Math.random() * 50000) + 1000,
            taxAmount: Math.floor(Math.random() * 5000) + 100,
            organizationId: org.id
          }
        });
        taxTxCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${taxTxCount} tax transactions`);
  totalCreated += taxTxCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 13. ANALYTICS (15 records - daily snapshots)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📈 Seeding analytics...');
  let analyticsCount = 0;
  const metricTypes = ['REVENUE', 'ORDERS', 'CUSTOMERS', 'PRODUCTS', 'VISITS'];
  for (let i = 0; i < 15; i++) {
    try {
      await prisma.analytics.create({
        data: {
          id: `analytics-${i + 1}`,
          type: metricTypes[i % metricTypes.length],
          value: Math.floor(Math.random() * 100000) + 1000,
          metadata: JSON.stringify({ date: new Date(), period: 'daily' }),
          organizationId: org.id
        }
      });
      analyticsCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${analyticsCount} analytics records`);
  totalCreated += analyticsCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 14. AI ANALYTICS (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🤖 Seeding ai_analytics...');
  let aiCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.ai_analytics.create({
        data: {
          id: `ai-${i + 1}`,
          organizationId: org.id,
          query: `AI query ${i + 1}`,
          insights: JSON.stringify({
            prediction: Math.random() * 100,
            confidence: Math.random(),
            recommendations: [`Recommendation ${i + 1}`]
          })
        }
      });
      aiCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${aiCount} AI analytics`);
  totalCreated += aiCount;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 15. AI CONVERSATIONS (10 records)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('💬 Seeding ai_conversations...');
  let aiConvCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.ai_conversations.create({
        data: {
          id: `aiconv-${i + 1}`,
          organizationId: org.id,
          messages: JSON.stringify([
            { role: 'user', content: `User message ${i + 1}` },
            { role: 'assistant', content: `AI response ${i + 1}` }
          ])
        }
      });
      aiConvCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${aiConvCount} AI conversations`);
  totalCreated += aiConvCount;

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ PART 1 COMPLETE - Created ${totalCreated} records across 14 tables!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


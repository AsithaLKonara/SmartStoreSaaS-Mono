import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 COMPREHENSIVE DATABASE SEEDING - ALL 43 EMPTY TABLES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Get existing data using raw queries to avoid enum mismatches
  const orgs: any[] = await prisma.$queryRaw`SELECT id, name, domain FROM organizations LIMIT 1`;
  const org = orgs[0];
  
  const products: any[] = await prisma.$queryRaw`SELECT id, name, sku, price, cost, "organizationId" FROM products LIMIT 10`;
  const customers: any[] = await prisma.$queryRaw`SELECT id, name, email, "organizationId" FROM customers LIMIT 7`;
  const users: any[] = await prisma.$queryRaw`SELECT id, name, email FROM users LIMIT 5`;
  const warehouses: any[] = await prisma.$queryRaw`SELECT id, name, "organizationId" FROM warehouses LIMIT 3`;

  if (!org || products.length === 0) {
    console.log('❌ Please run simple-seed.ts first to create core data!');
    return;
  }

  console.log(`✅ Found organization: ${org.name}`);
  console.log(`✅ Found ${products.length} products`);
  console.log(`✅ Found ${customers.length} customers`);
  console.log('');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. INVENTORY & VARIANTS (2 tables)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📦 Seeding Inventory & Variants...');
  
  // ProductVariant (10+ records)
  const variants = [];
  for (let i = 0; i < Math.min(10, products.length); i++) {
    const product = products[i];
    for (let v = 0; v < 2; v++) {
      try {
        const variant = await prisma.productVariant.create({
          data: {
            name: `${product.name} - ${v === 0 ? 'Small' : 'Large'}`,
            sku: `${product.sku}-${v === 0 ? 'SM' : 'LG'}`,
            price: product.price,
            cost: product.cost || product.price,
            stock: Math.floor(Math.random() * 50) + 10,
            productId: product.id,
            organizationId: org.id
          }
        });
        variants.push(variant);
      } catch (e) {
        // Skip if already exists
      }
    }
  }
  console.log(`✅ Created ${variants.length} product variants`);

  // warehouse_inventory (10+ records)
  let warehouseInvCount = 0;
  if (warehouses.length > 0) {
    for (const warehouse of warehouses.slice(0, 3)) {
      for (const product of products.slice(0, 5)) {
        try {
          await prisma.warehouse_inventory.create({
            data: {
              warehouseId: warehouse.id,
              productId: product.id,
              quantity: Math.floor(Math.random() * 100) + 20,
              organizationId: org.id
            }
          });
          warehouseInvCount++;
        } catch (e) {
          // Skip if already exists
        }
      }
    }
  }
  console.log(`✅ Created ${warehouseInvCount} warehouse inventory records`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. CUSTOMER ENGAGEMENT (6 tables)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🎁 Seeding Customer Engagement...');

  // CustomerLoyalty (10+ records)
  const loyalties = [];
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  for (let i = 0; i < customers.length; i++) {
    try {
      const loyalty = await prisma.customerLoyalty.create({
        data: {
          customerId: customers[i].id,
          points: Math.floor(Math.random() * 10000),
          tier: tiers[Math.floor(Math.random() * tiers.length)],
          lifetimePoints: Math.floor(Math.random() * 20000),
          organizationId: org.id
        }
      });
      loyalties.push(loyalty);
    } catch (e) {
      // Skip if already exists
    }
  }
  console.log(`✅ Created ${loyalties.length} loyalty programs`);

  // loyalty_transactions (10+ records)
  let loyaltyTxCount = 0;
  for (const loyalty of loyalties.slice(0, 10)) {
    for (let i = 0; i < 3; i++) {
      try {
        await prisma.loyalty_transactions.create({
          data: {
            loyaltyId: loyalty.id,
            points: Math.floor(Math.random() * 100) + 10,
            type: i % 2 === 0 ? 'EARN' : 'REDEEM',
            description: i % 2 === 0 ? 'Purchase reward' : 'Redeemed discount',
            organizationId: org.id
          }
        });
        loyaltyTxCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${loyaltyTxCount} loyalty transactions`);

  // wishlists (10+ records)
  const wishlists = [];
  for (const customer of customers) {
    try {
      const wishlist = await prisma.wishlists.create({
        data: {
          customerId: customer.id,
          name: `${customer.name}'s Wishlist`,
          organizationId: org.id
        }
      });
      wishlists.push(wishlist);
    } catch (e) {}
  }
  console.log(`✅ Created ${wishlists.length} wishlists`);

  // wishlist_items (10+ records)
  let wishlistItemCount = 0;
  for (const wishlist of wishlists) {
    const itemCount = Math.min(3, products.length);
    for (let i = 0; i < itemCount; i++) {
      try {
        await prisma.wishlist_items.create({
          data: {
            wishlistId: wishlist.id,
            productId: products[i].id
          }
        });
        wishlistItemCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${wishlistItemCount} wishlist items`);

  // customer_segments (10 records)
  const segments = [];
  const segmentNames = ['VIP Customers', 'Regular Buyers', 'New Customers', 'High Value', 
                        'Inactive', 'Frequent Buyers', 'Seasonal', 'Wholesale', 'Retail', 'Online Only'];
  for (let i = 0; i < 10; i++) {
    try {
      const segment = await prisma.customer_segments.create({
        data: {
          name: segmentNames[i],
          description: `Segment for ${segmentNames[i].toLowerCase()}`,
          criteria: JSON.stringify({ minPurchases: i + 1, minValue: (i + 1) * 1000 }),
          organizationId: org.id
        }
      });
      segments.push(segment);
    } catch (e) {}
  }
  console.log(`✅ Created ${segments.length} customer segments`);

  // customer_segment_customers (10+ records)
  let segmentCustomerCount = 0;
  for (const segment of segments.slice(0, 5)) {
    for (const customer of customers.slice(0, 3)) {
      try {
        await prisma.customer_segment_customers.create({
          data: {
            segmentId: segment.id,
            customerId: customer.id
          }
        });
        segmentCustomerCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${segmentCustomerCount} segment-customer mappings`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. ACCOUNTING & FINANCE (6 tables)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('💰 Seeding Accounting & Finance...');

  // chart_of_accounts (10+ records)
  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
  const accounts = [];
  const accountNames = [
    { name: 'Cash', type: 'ASSET', code: '1001' },
    { name: 'Accounts Receivable', type: 'ASSET', code: '1100' },
    { name: 'Inventory', type: 'ASSET', code: '1200' },
    { name: 'Equipment', type: 'ASSET', code: '1500' },
    { name: 'Accounts Payable', type: 'LIABILITY', code: '2000' },
    { name: 'Loans Payable', type: 'LIABILITY', code: '2100' },
    { name: 'Owner Equity', type: 'EQUITY', code: '3000' },
    { name: 'Sales Revenue', type: 'REVENUE', code: '4000' },
    { name: 'Service Revenue', type: 'REVENUE', code: '4100' },
    { name: 'Cost of Goods Sold', type: 'EXPENSE', code: '5000' },
    { name: 'Rent Expense', type: 'EXPENSE', code: '6100' },
    { name: 'Utilities Expense', type: 'EXPENSE', code: '6200' },
  ];
  
  for (const acc of accountNames) {
    try {
      const account = await prisma.chart_of_accounts.create({
        data: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          balance: Math.floor(Math.random() * 1000000),
          organizationId: org.id
        }
      });
      accounts.push(account);
    } catch (e) {}
  }
  console.log(`✅ Created ${accounts.length} chart of accounts`);

  // journal_entries (10 records)
  const journalEntries = [];
  for (let i = 0; i < 10; i++) {
    try {
      const entry = await prisma.journal_entries.create({
        data: {
          entryNumber: `JE-${String(i + 1).padStart(4, '0')}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          description: `Journal Entry ${i + 1}`,
          organizationId: org.id
        }
      });
      journalEntries.push(entry);
    } catch (e) {}
  }
  console.log(`✅ Created ${journalEntries.length} journal entries`);

  // journal_entry_lines (20+ records)
  let journalLineCount = 0;
  for (const entry of journalEntries) {
    if (accounts.length >= 2) {
      const amount = Math.floor(Math.random() * 50000) + 1000;
      try {
        await prisma.journal_entry_lines.create({
          data: {
            journalEntryId: entry.id,
            accountId: accounts[0].id,
            debit: amount,
            credit: 0
          }
        });
        await prisma.journal_entry_lines.create({
          data: {
            journalEntryId: entry.id,
            accountId: accounts[1].id,
            debit: 0,
            credit: amount
          }
        });
        journalLineCount += 2;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${journalLineCount} journal entry lines`);

  // ledger (10+ records)
  let ledgerCount = 0;
  for (const account of accounts.slice(0, 10)) {
    for (let i = 0; i < 2; i++) {
      try {
        await prisma.ledger.create({
          data: {
            accountId: account.id,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            description: `Transaction ${i + 1}`,
            debit: i === 0 ? Math.floor(Math.random() * 10000) : 0,
            credit: i === 1 ? Math.floor(Math.random() * 10000) : 0,
            balance: Math.floor(Math.random() * 50000),
            organizationId: org.id
          }
        });
        ledgerCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${ledgerCount} ledger entries`);

  // tax_rates (10 records)
  const taxRates = [];
  const taxNames = ['VAT 15%', 'VAT 8%', 'VAT 0%', 'Import Tax 10%', 'Luxury Tax 25%', 
                    'Service Tax 5%', 'Sales Tax 7%', 'GST 18%', 'Excise 12%', 'County Tax 3%'];
  for (let i = 0; i < 10; i++) {
    try {
      const rate = await prisma.tax_rates.create({
        data: {
          name: taxNames[i],
          rate: [15, 8, 0, 10, 25, 5, 7, 18, 12, 3][i],
          type: i < 3 ? 'VAT' : 'OTHER',
          organizationId: org.id
        }
      });
      taxRates.push(rate);
    } catch (e) {}
  }
  console.log(`✅ Created ${taxRates.length} tax rates`);

  // tax_transactions (10 records)
  let taxTxCount = 0;
  const orders = await prisma.order.findMany({ take: 10 });
  for (let i = 0; i < Math.min(10, orders.length); i++) {
    if (taxRates.length > 0) {
      try {
        await prisma.tax_transactions.create({
          data: {
            orderId: orders[i].id,
            taxRateId: taxRates[i % taxRates.length].id,
            amount: Math.floor(Math.random() * 5000) + 100,
            organizationId: org.id
          }
        });
        taxTxCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${taxTxCount} tax transactions`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. ANALYTICS & AI (4 tables)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📊 Seeding Analytics & AI...');

  // Analytics (10 records - daily snapshots)
  let analyticsCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.analytics.create({
        data: {
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          totalRevenue: Math.floor(Math.random() * 500000) + 100000,
          totalOrders: Math.floor(Math.random() * 100) + 10,
          totalCustomers: Math.floor(Math.random() * 50) + 5,
          averageOrderValue: Math.floor(Math.random() * 50000) + 5000,
          organizationId: org.id
        }
      });
      analyticsCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${analyticsCount} analytics snapshots`);

  // ai_analytics (10 records)
  let aiAnalyticsCount = 0;
  const insightTypes = ['demand_forecast', 'churn_prediction', 'price_optimization', 'inventory_alert', 'sales_trend'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.ai_analytics.create({
        data: {
          type: insightTypes[i % insightTypes.length],
          insight: JSON.stringify({
            prediction: Math.random() * 100,
            confidence: Math.random(),
            recommendation: `AI recommendation ${i + 1}`
          }),
          confidence: Math.random(),
          organizationId: org.id
        }
      });
      aiAnalyticsCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${aiAnalyticsCount} AI analytics`);

  // ai_conversations (10 records)
  let aiConvCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.ai_conversations.create({
        data: {
          userId: users[i % users.length].id,
          message: `User question ${i + 1}`,
          response: `AI response ${i + 1}`,
          organizationId: org.id
        }
      });
      aiConvCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${aiConvCount} AI conversations`);

  // Report (10 records)
  let reportCount = 0;
  const reportTypes = ['SALES', 'INVENTORY', 'CUSTOMER', 'FINANCIAL', 'TAX'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.report.create({
        data: {
          type: reportTypes[i % reportTypes.length],
          name: `${reportTypes[i % reportTypes.length]} Report ${i + 1}`,
          generatedBy: users[0].id,
          organizationId: org.id,
          data: JSON.stringify({ summary: 'Report data', records: i + 1 })
        }
      });
      reportCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${reportCount} reports`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. INTEGRATIONS (9 tables)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🔌 Seeding Integrations...');

  // WooCommerceIntegration (3 records)
  let wooCount = 0;
  for (let i = 0; i < 3; i++) {
    try {
      await prisma.wooCommerceIntegration.create({
        data: {
          storeUrl: `https://store${i + 1}.example.com`,
          consumerKey: `ck_${Math.random().toString(36).substr(2, 20)}`,
          consumerSecret: `cs_${Math.random().toString(36).substr(2, 40)}`,
          isActive: true,
          organizationId: org.id
        }
      });
      wooCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${wooCount} WooCommerce integrations`);

  // WhatsAppIntegration (3 records)
  let whatsappCount = 0;
  for (let i = 0; i < 3; i++) {
    try {
      await prisma.whatsAppIntegration.create({
        data: {
          phoneNumber: `+9477${String(i + 1000000).substr(0, 7)}`,
          accountSid: `AC${Math.random().toString(36).substr(2, 32)}`,
          authToken: `token_${Math.random().toString(36).substr(2, 32)}`,
          isActive: true,
          organizationId: org.id
        }
      });
      whatsappCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${whatsappCount} WhatsApp integrations`);

  // whatsapp_messages (10 records)
  let whatsappMsgCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.whatsapp_messages.create({
        data: {
          to: `+9477123456${i}`,
          message: `WhatsApp message ${i + 1}`,
          status: ['sent', 'delivered', 'read'][i % 3],
          organizationId: org.id
        }
      });
      whatsappMsgCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${whatsappMsgCount} WhatsApp messages`);

  // sms_templates (10 records)
  let smsTemplateCount = 0;
  const templateNames = ['Order Confirmation', 'Delivery Update', 'Payment Receipt', 'Welcome Message', 
                         'Promo Alert', 'OTP Verification', 'Low Stock Alert', 'Birthday Wish', 
                         'Abandoned Cart', 'Review Request'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.sms_templates.create({
        data: {
          name: templateNames[i],
          content: `Template for ${templateNames[i]}: {message}`,
          organizationId: org.id
        }
      });
      smsTemplateCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${smsTemplateCount} SMS templates`);

  // sms_campaigns (10 records)
  let smsCampaignCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.sms_campaigns.create({
        data: {
          name: `Campaign ${i + 1}`,
          message: `Campaign message ${i + 1}`,
          status: ['DRAFT', 'SCHEDULED', 'SENT', 'COMPLETED'][i % 4],
          organizationId: org.id
        }
      });
      smsCampaignCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${smsCampaignCount} SMS campaigns`);

  // sms_logs (10 records)
  let smsLogCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.sms_logs.create({
        data: {
          to: `+9477123456${i}`,
          message: `SMS ${i + 1}`,
          status: ['sent', 'delivered', 'failed'][i % 3],
          organizationId: org.id
        }
      });
      smsLogCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${smsLogCount} SMS logs`);

  // sms_subscriptions (10 records)
  let smsSubCount = 0;
  for (let i = 0; i < Math.min(10, customers.length); i++) {
    try {
      await prisma.sms_subscriptions.create({
        data: {
          customerId: customers[i].id,
          phoneNumber: `+9477123456${i}`,
          isActive: i % 3 !== 0,
          organizationId: org.id
        }
      });
      smsSubCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${smsSubCount} SMS subscriptions`);

  // integration_logs (10 records)
  let integrationLogCount = 0;
  const logTypes = ['woocommerce', 'whatsapp', 'stripe', 'shopify'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.integration_logs.create({
        data: {
          type: logTypes[i % logTypes.length],
          action: i % 2 === 0 ? 'sync' : 'webhook',
          status: ['success', 'failed'][i % 2],
          message: `Integration log ${i + 1}`,
          organizationId: org.id
        }
      });
      integrationLogCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${integrationLogCount} integration logs`);

  // channel_integrations (5 records)
  let channelCount = 0;
  const channels = ['facebook', 'instagram', 'tiktok', 'shopify', 'amazon'];
  for (let i = 0; i < 5; i++) {
    try {
      await prisma.channel_integrations.create({
        data: {
          channel: channels[i],
          isActive: true,
          credentials: JSON.stringify({ apiKey: `key_${i}` }),
          organizationId: org.id
        }
      });
      channelCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${channelCount} channel integrations`);

  console.log('');
  console.log('🔄 Part 1 Complete - Continuing with Advanced Features...');
  console.log('');
  
  // TO BE CONTINUED IN PART 2...
  console.log('✅ COMPREHENSIVE SEEDING COMPLETED - PART 1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


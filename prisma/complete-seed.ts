const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  // 1. Organization
  console.log('📊 Seeding Organizations...');
  const orgs = [];
  for (let i = 1; i <= 10; i++) {
    const org = await prisma.organization.upsert({
      where: { id: `org-${i}` },
      update: {},
      create: {
        id: `org-${i}`,
        name: `SmartStore ${i}`,
        slug: `smartstore-${i}`,
        email: `contact@smartstore${i}.com`,
        phone: `+1555000${String(i).padStart(4, '0')}`,
        address: `${100 + i} Commerce Street`,
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: `9410${i}`,
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        plan: i <= 3 ? 'enterprise' : i <= 7 ? 'professional' : 'starter',
        isActive: true,
      },
    });
    orgs.push(org);
  }
  console.log(`✅ Created ${orgs.length} organizations\n`);

  // Use first org for remaining data
  const org = orgs[0];

  // 2. Users
  console.log('👥 Seeding Users...');
  const users = [];
  const roles = ['admin', 'manager', 'staff', 'viewer'];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@smartstore1.com` },
      update: {},
      create: {
        email: `user${i}@smartstore1.com`,
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // password123
        name: `User ${i}`,
        role: roles[i % roles.length],
        organizationId: org.id,
        isActive: true,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users\n`);

  // 3. Categories
  console.log('📁 Seeding Categories...');
  const categories = [];
  const categoryNames = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Food', 'Beauty', 'Automotive', 'Health'];
  for (let i = 0; i < 10; i++) {
    const category = await prisma.category.upsert({
      where: { id: `cat-${i + 1}` },
      update: {},
      create: {
        id: `cat-${i + 1}`,
        name: categoryNames[i],
        slug: categoryNames[i].toLowerCase().replace(/\s+/g, '-'),
        description: `${categoryNames[i]} products and accessories`,
      },
    });
    categories.push(category);
  }
  console.log(`✅ Created ${categories.length} categories\n`);

  // 4. Products
  console.log('📦 Seeding Products...');
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.product.upsert({
      where: { id: `prod-${i}` },
      update: {},
      create: {
        id: `prod-${i}`,
        organizationId: org.id,
        name: `Premium Product ${i}`,
        description: `High-quality product ${i} with excellent features`,
        sku: `SKU-${String(i).padStart(5, '0')}`,
        price: 99.99 + i * 10,
        cost: 49.99 + i * 5,
        stock: 100 + i * 10,
        lowStockThreshold: 10,
        categoryId: categories[i % categories.length].id,
        isActive: true,
        weight: 1.5 + i * 0.1,
        dimensions: '10x10x10',
      },
    });
    products.push(product);
  }
  console.log(`✅ Created ${products.length} products\n`);

  // 5. Customers
  console.log('👤 Seeding Customers...');
  const customers = [];
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customer.upsert({
      where: { email: `customer${i}@example.com` },
      update: {},
      create: {
        organizationId: org.id,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+1555${String(1000 + i).padStart(7, '0')}`,
        address: `${200 + i} Customer Lane`,
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postalCode: `9000${i}`,
        customerType: i % 2 === 0 ? 'retail' : 'wholesale',
        status: 'active',
      },
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers\n`);

  // 6. Orders
  console.log('🛒 Seeding Orders...');
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const order = await prisma.order.create({
      data: {
        organizationId: org.id,
        customerId: customers[i % customers.length].id,
        orderNumber: `ORD-${new Date().getFullYear()}-${String(i).padStart(6, '0')}`,
        status: ['pending', 'processing', 'shipped', 'delivered'][i % 4],
        subtotal: 100 * i,
        tax: 10 * i,
        shipping: 5 * i,
        total: 115 * i,
        currency: 'USD',
        shippingAddress: `${200 + i} Customer Lane, Los Angeles, CA 9000${i}`,
        billingAddress: `${200 + i} Customer Lane, Los Angeles, CA 9000${i}`,
      },
    });
    orders.push(order);
  }
  console.log(`✅ Created ${orders.length} orders\n`);

  // 7. Order Items
  console.log('📋 Seeding Order Items...');
  let itemCount = 0;
  for (const order of orders) {
    for (let i = 0; i < 3; i++) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: products[i % products.length].id,
          productName: products[i % products.length].name,
          sku: products[i % products.length].sku,
          quantity: i + 1,
          price: products[i % products.length].price,
          total: products[i % products.length].price * (i + 1),
        },
      });
      itemCount++;
    }
  }
  console.log(`✅ Created ${itemCount} order items\n`);

  // 8. Payments
  console.log('💳 Seeding Payments...');
  for (let i = 0; i < orders.length; i++) {
    await prisma.payment.create({
      data: {
        orderId: orders[i].id,
        amount: orders[i].total,
        currency: 'USD',
        paymentMethod: ['credit_card', 'paypal', 'stripe'][i % 3],
        status: 'completed',
        transactionId: `TXN-${Date.now()}-${i}`,
      },
    });
  }
  console.log(`✅ Created ${orders.length} payments\n`);

  // 9. Warehouses
  console.log('🏭 Seeding Warehouses...');
  const warehouses = [];
  for (let i = 1; i <= 10; i++) {
    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: org.id,
        name: `Warehouse ${i}`,
        code: `WH-${String(i).padStart(3, '0')}`,
        address: `${300 + i} Warehouse Blvd`,
        city: 'Oakland',
        state: 'CA',
        country: 'USA',
        postalCode: `9460${i}`,
        isActive: true,
      },
    });
    warehouses.push(warehouse);
  }
  console.log(`✅ Created ${warehouses.length} warehouses\n`);

  // 10. Suppliers
  console.log('🏢 Seeding Suppliers...');
  const suppliers = [];
  for (let i = 1; i <= 10; i++) {
    const supplier = await prisma.supplier.create({
      data: {
        organizationId: org.id,
        supplierCode: `SUP-${String(i).padStart(5, '0')}`,
        companyName: `Supplier Company ${i}`,
        contactName: `Contact Person ${i}`,
        email: `supplier${i}@example.com`,
        phone: `+1555${String(2000 + i).padStart(7, '0')}`,
        address: `${400 + i} Supplier Street`,
        city: 'San Jose',
        state: 'CA',
        country: 'USA',
        postalCode: `9510${i}`,
        paymentTerms: 'NET30',
        status: 'active',
      },
    });
    suppliers.push(supplier);
  }
  console.log(`✅ Created ${suppliers.length} suppliers\n`);

  // 11. Chart of Accounts
  console.log('📊 Seeding Chart of Accounts...');
  const accounts = [];
  const accountData = [
    { code: '1000', name: 'Cash', type: 'ASSET', category: 'current_asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', category: 'current_asset' },
    { code: '1200', name: 'Inventory', type: 'ASSET', category: 'current_asset' },
    { code: '1500', name: 'Equipment', type: 'ASSET', category: 'fixed_asset' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', category: 'current_liability' },
    { code: '2100', name: 'Loans Payable', type: 'LIABILITY', category: 'long_term_liability' },
    { code: '3000', name: 'Owners Equity', type: 'EQUITY', category: 'equity' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', category: 'operating_revenue' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'cost_of_sales' },
    { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', category: 'operating_expense' },
  ];

  for (const acc of accountData) {
    const account = await prisma.chartOfAccounts.create({
      data: {
        organizationId: org.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        balance: 10000 + Math.random() * 50000,
        isActive: true,
      },
    });
    accounts.push(account);
  }
  console.log(`✅ Created ${accounts.length} accounts\n`);

  // 12. Tax Rates
  console.log('💰 Seeding Tax Rates...');
  const taxRates = [];
  const taxData = [
    { name: 'Federal VAT', code: 'VAT', rate: 10, jurisdiction: 'Federal' },
    { name: 'State Tax', code: 'ST', rate: 7.5, jurisdiction: 'California' },
    { name: 'City Tax', code: 'CT', rate: 2.5, jurisdiction: 'San Francisco' },
    { name: 'Import Tax', code: 'IT', rate: 15, jurisdiction: 'Federal' },
    { name: 'Luxury Tax', code: 'LT', rate: 20, jurisdiction: 'Federal' },
    { name: 'County Tax', code: 'CNT', rate: 1.5, jurisdiction: 'County' },
    { name: 'Sales Tax', code: 'SLS', rate: 8.5, jurisdiction: 'State' },
    { name: 'Service Tax', code: 'SRV', rate: 5, jurisdiction: 'Federal' },
    { name: 'Environmental Tax', code: 'ENV', rate: 3, jurisdiction: 'State' },
    { name: 'Excise Tax', code: 'EXC', rate: 12, jurisdiction: 'Federal' },
  ];

  for (const tax of taxData) {
    const taxRate = await prisma.taxRate.create({
      data: {
        organizationId: org.id,
        name: tax.name,
        code: tax.code,
        rate: tax.rate,
        jurisdiction: tax.jurisdiction,
        taxType: 'sales',
        isActive: true,
      },
    });
    taxRates.push(taxRate);
  }
  console.log(`✅ Created ${taxRates.length} tax rates\n`);

  // 13. POS Terminals
  console.log('🖥️ Seeding POS Terminals...');
  const terminals = [];
  for (let i = 1; i <= 10; i++) {
    const terminal = await prisma.pOSTerminal.create({
      data: {
        organizationId: org.id,
        warehouseId: warehouses[i % warehouses.length].id,
        terminalName: `POS Terminal ${i}`,
        terminalCode: `TERM-${String(i).padStart(4, '0')}`,
        deviceId: `DEV-${String(i).padStart(6, '0')}`,
        status: 'active',
        ipAddress: `192.168.1.${100 + i}`,
      },
    });
    terminals.push(terminal);
  }
  console.log(`✅ Created ${terminals.length} POS terminals\n`);

  // 14. Gift Cards
  console.log('🎁 Seeding Gift Cards...');
  for (let i = 1; i <= 10; i++) {
    await prisma.giftCard.create({
      data: {
        organizationId: org.id,
        code: `GC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        initialValue: 50 + i * 10,
        currentBalance: 25 + i * 5,
        recipientEmail: `recipient${i}@example.com`,
        recipientName: `Recipient ${i}`,
        senderName: `Sender ${i}`,
        status: 'active',
      },
    });
  }
  console.log(`✅ Created 10 gift cards\n`);

  // 15. Email Campaigns
  console.log('📧 Seeding Email Campaigns...');
  for (let i = 1; i <= 10; i++) {
    await prisma.emailCampaign.create({
      data: {
        organizationId: org.id,
        name: `Campaign ${i}`,
        subject: `Special Offer ${i}`,
        htmlContent: `<h1>Campaign ${i}</h1><p>Great deals!</p>`,
        textContent: `Campaign ${i} - Great deals!`,
        campaignType: ['newsletter', 'promotional', 'drip'][i % 3],
        status: ['draft', 'sent'][i % 2],
      },
    });
  }
  console.log(`✅ Created 10 email campaigns\n`);

  // 16. Subscriptions
  console.log('🔄 Seeding Subscriptions...');
  for (let i = 1; i <= 10; i++) {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        customerId: customers[i % customers.length].id,
        planName: `${['Basic', 'Pro', 'Enterprise'][i % 3]} Plan`,
        planType: 'monthly',
        amount: 29.99 * (i % 3 + 1),
        billingInterval: 'month',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        nextBillingDate: nextMonth,
      },
    });
  }
  console.log(`✅ Created 10 subscriptions\n`);

  // 17. Affiliates
  console.log('🤝 Seeding Affiliates...');
  for (let i = 1; i <= 10; i++) {
    await prisma.affiliate.create({
      data: {
        organizationId: org.id,
        affiliateCode: `AFF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        name: `Affiliate ${i}`,
        email: `affiliate${i}@example.com`,
        commissionRate: 5 + i * 0.5,
        totalEarnings: 1000 + i * 500,
        paidEarnings: 500 + i * 250,
        status: 'active',
      },
    });
  }
  console.log(`✅ Created 10 affiliates\n`);

  // 18. Employees
  console.log('👔 Seeding Employees...');
  for (let i = 1; i <= 10; i++) {
    await prisma.employee.create({
      data: {
        organizationId: org.id,
        employeeCode: `EMP-${String(i).padStart(5, '0')}`,
        firstName: `Employee`,
        lastName: `${i}`,
        email: `employee${i}@smartstore1.com`,
        phone: `+1555${String(3000 + i).padStart(7, '0')}`,
        position: ['Sales', 'Manager', 'Cashier', 'Warehouse'][i % 4],
        department: ['Sales', 'Operations', 'Finance'][i % 3],
        hireDate: new Date(2024, 0, i),
        salary: 40000 + i * 5000,
        commissionRate: 2 + i * 0.5,
        employmentStatus: 'active',
      },
    });
  }
  console.log(`✅ Created 10 employees\n`);

  // 19. API Keys
  console.log('🔑 Seeding API Keys...');
  for (let i = 1; i <= 10; i++) {
    await prisma.aPIKey.create({
      data: {
        organizationId: org.id,
        name: `API Key ${i}`,
        key: `sk_${Math.random().toString(36).substring(2, 26)}`,
        secretHash: `hash_${Math.random().toString(36).substring(2, 32)}`,
        permissions: JSON.stringify(['read', 'write']),
        rateLimit: 1000 * i,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created 10 API keys\n`);

  // 20. Webhooks
  console.log('🪝 Seeding Webhooks...');
  for (let i = 1; i <= 10; i++) {
    await prisma.webhook.create({
      data: {
        organizationId: org.id,
        url: `https://example.com/webhook-${i}`,
        events: JSON.stringify(['order.created', 'payment.completed']),
        secret: `whsec_${Math.random().toString(36).substring(2, 32)}`,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created 10 webhooks\n`);

  console.log('✅ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • 10 Organizations`);
  console.log(`   • 10 Users`);
  console.log(`   • 10 Categories`);
  console.log(`   • 10 Products`);
  console.log(`   • 10 Customers`);
  console.log(`   • 10 Orders (30 order items)`);
  console.log(`   • 10 Payments`);
  console.log(`   • 10 Warehouses`);
  console.log(`   • 10 Suppliers`);
  console.log(`   • 10 Accounts`);
  console.log(`   • 10 Tax Rates`);
  console.log(`   • 10 POS Terminals`);
  console.log(`   • 10 Gift Cards`);
  console.log(`   • 10 Email Campaigns`);
  console.log(`   • 10 Subscriptions`);
  console.log(`   • 10 Affiliates`);
  console.log(`   • 10 Employees`);
  console.log(`   • 10 API Keys`);
  console.log(`   • 10 Webhooks`);
  console.log(`\n🎉 Total: 200+ records created!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




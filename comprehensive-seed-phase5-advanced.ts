import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 PHASE 5: Advanced Features (Accounting, Integrations, AI)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let total = 0;

  const orgs = await prisma.Organization.findMany();
  const org = orgs[0];
  const customers = await prisma.Customer.findMany();
  const orders = await prisma.Order.findMany();
  const users = await prisma.User.findMany();
  const warehouses = await prisma.Warehouse.findMany();
  const products = await prisma.Product.findMany();

  // 22. chart_of_accounts (20 records)
  console.log('📒 Creating chart of accounts...');
  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
  const accountSubTypes = {
    'ASSET': 'CURRENT_ASSET',
    'LIABILITY': 'CURRENT_LIABILITY',
    'EQUITY': 'CAPITAL',
    'REVENUE': 'OPERATING_REVENUE',
    'EXPENSE': 'OPERATING_EXPENSE'
  };
  
  const accounts = [
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '1200', name: 'Inventory', type: 'ASSET' },
    { code: '1300', name: 'Prepaid Expenses', type: 'ASSET' },
    { code: '1500', name: 'Equipment', type: 'ASSET' },
    { code: '1600', name: 'Buildings', type: 'ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '2100', name: 'Loans Payable', type: 'LIABILITY' },
    { code: '2200', name: 'Credit Cards', type: 'LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
    { code: '4100', name: 'Service Revenue', type: 'REVENUE' },
    { code: '4200', name: 'Interest Income', type: 'REVENUE' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
    { code: '6100', name: 'Rent Expense', type: 'EXPENSE' },
    { code: '6200', name: 'Utilities Expense', type: 'EXPENSE' },
    { code: '6300', name: 'Salaries Expense', type: 'EXPENSE' },
    { code: '6400', name: 'Marketing Expense', type: 'EXPENSE' },
    { code: '6500', name: 'Office Supplies', type: 'EXPENSE' }
  ];

  const chartAccounts = [];
  for (const acc of accounts) {
    try {
      const created = await prisma.chart_of_accounts.create({
        data: {
          organizationId: org.id,
          code: acc.code,
          name: acc.name,
          accountType: acc.type,
          accountSubType: accountSubTypes[acc.type as keyof typeof accountSubTypes],
          balance: Math.floor(Math.random() * 1000000)
        }
      });
      chartAccounts.push(created);
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${chartAccounts.length} chart of accounts`);

  // 23. journal_entries (20 records)
  console.log('📝 Creating journal entries...');
  const journalEntries = [];
  for (let i = 0; i < 20; i++) {
    try {
      const entry = await prisma.journal_entries.create({
        data: {
          entryNumber: `JE-${String(i + 1).padStart(6, '0')}`,
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          description: `Journal Entry ${i + 1}`,
          organizationId: org.id
        }
      });
      journalEntries.push(entry);
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${journalEntries.length} journal entries`);

  // 24. journal_entry_lines (40 records - 2 per entry)
  console.log('📋 Creating journal entry lines...');
  let lineCount = 0;
  for (const entry of journalEntries) {
    if (chartAccounts.length >= 2) {
      const amount = Math.floor(Math.random() * 100000) + 1000;
      try {
        await prisma.journal_entry_lines.create({
          data: {
            journalEntryId: entry.id,
            accountId: chartAccounts[0].id,
            debit: amount,
            credit: 0
          }
        });
        await prisma.journal_entry_lines.create({
          data: {
            journalEntryId: entry.id,
            accountId: chartAccounts[1].id,
            debit: 0,
            credit: amount
          }
        });
        lineCount += 2;
        total += 2;
      } catch(e) {}
    }
  }
  console.log(`✅ Created ${lineCount} journal entry lines`);

  // 25. ledger (40 records)
  console.log('📊 Creating ledger entries...');
  let ledgerCount = 0;
  for (const account of chartAccounts) {
    for (let i = 0; i < 2; i++) {
      try {
        await prisma.ledger.create({
          data: {
            accountId: account.id,
            date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
            description: `Transaction ${i + 1}`,
            debit: i === 0 ? Math.floor(Math.random() * 50000) : 0,
            credit: i === 1 ? Math.floor(Math.random() * 50000) : 0,
            balance: Math.floor(Math.random() * 500000),
            organizationId: org.id
          }
        });
        ledgerCount++;
        total++;
      } catch(e) {}
    }
  }
  console.log(`✅ Created ${ledgerCount} ledger entries`);

  // 26. tax_rates (15 records)
  console.log('💰 Creating tax rates...');
  const taxData = [
    { name: 'VAT 15%', rate: 15, type: 'VAT' },
    { name: 'VAT 8%', rate: 8, type: 'VAT' },
    { name: 'VAT 0%', rate: 0, type: 'ZERO_RATED' },
    { name: 'Import Tax 10%', rate: 10, type: 'IMPORT' },
    { name: 'Luxury Tax 25%', rate: 25, type: 'LUXURY' },
    { name: 'Service Tax 5%', rate: 5, type: 'SERVICE' },
    { name: 'Sales Tax 7%', rate: 7, type: 'SALES' },
    { name: 'GST 18%', rate: 18, type: 'GST' },
    { name: 'Excise Tax 12%', rate: 12, type: 'EXCISE' },
    { name: 'County Tax 3%', rate: 3, type: 'LOCAL' },
    { name: 'Entertainment Tax 15%', rate: 15, type: 'ENTERTAINMENT' },
    { name: 'Property Tax 1.5%', rate: 1.5, type: 'PROPERTY' },
    { name: 'Stamp Duty 2%', rate: 2, type: 'STAMP_DUTY' },
    { name: 'Withholding Tax 5%', rate: 5, type: 'WITHHOLDING' },
    { name: 'Corporate Tax 28%', rate: 28, type: 'CORPORATE' }
  ];

  const taxRates = [];
  for (const tax of taxData) {
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
  console.log(`✅ Created ${taxRates.length} tax rates`);

  // 27. tax_transactions (30 records)
  console.log('💵 Creating tax transactions...');
  let taxTxCount = 0;
  for (let i = 0; i < Math.min(30, orders.length); i++) {
    const taxRate = taxRates[i % taxRates.length];
    try {
      await prisma.tax_transactions.create({
        data: {
          orderId: orders[i].id,
          taxRateId: taxRate.id,
          taxableAmount: Math.floor(Math.random() * 100000),
          taxAmount: Math.floor(Math.random() * 15000),
          organizationId: org.id
        }
      });
      taxTxCount++;
      total++;
    } catch(e) {}
  }
  console.log(`✅ Created ${taxTxCount} tax transactions`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ PHASE 5 COMPLETE: ${total} new records`);
  console.log(`Running total: ~${545 + total} records!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


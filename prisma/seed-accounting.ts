import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding accounting data...');

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('❌ No organization found. Run quick-seed.ts first.');
    return;
  }

  console.log('✅ Found organization:', org.name);

  // Seed default Chart of Accounts (US GAAP)
  const accounts = await prisma.chartOfAccounts.createMany({
    data: [
      // Assets
      { organizationId: org.id, code: '1000', name: 'Assets', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET' },
      { organizationId: org.id, code: '1010', name: 'Cash', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET' },
      { organizationId: org.id, code: '1020', name: 'Accounts Receivable', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET' },
      { organizationId: org.id, code: '1030', name: 'Inventory', accountType: 'ASSET', accountSubType: 'CURRENT_ASSET' },
      { organizationId: org.id, code: '1500', name: 'Fixed Assets', accountType: 'ASSET', accountSubType: 'FIXED_ASSET' },
      
      // Liabilities
      { organizationId: org.id, code: '2000', name: 'Liabilities', accountType: 'LIABILITY', accountSubType: 'CURRENT_LIABILITY' },
      { organizationId: org.id, code: '2010', name: 'Accounts Payable', accountType: 'LIABILITY', accountSubType: 'CURRENT_LIABILITY' },
      { organizationId: org.id, code: '2020', name: 'Sales Tax Payable', accountType: 'LIABILITY', accountSubType: 'CURRENT_LIABILITY' },
      
      // Equity
      { organizationId: org.id, code: '3000', name: 'Equity', accountType: 'EQUITY', accountSubType: 'OWNERS_EQUITY' },
      { organizationId: org.id, code: '3010', name: 'Retained Earnings', accountType: 'EQUITY', accountSubType: 'RETAINED_EARNINGS' },
      
      // Revenue
      { organizationId: org.id, code: '4000', name: 'Sales Revenue', accountType: 'REVENUE', accountSubType: 'OPERATING_REVENUE' },
      { organizationId: org.id, code: '4010', name: 'Service Revenue', accountType: 'REVENUE', accountSubType: 'OPERATING_REVENUE' },
      
      // Expenses
      { organizationId: org.id, code: '5000', name: 'Cost of Goods Sold', accountType: 'EXPENSE', accountSubType: 'COST_OF_GOODS_SOLD' },
      { organizationId: org.id, code: '6000', name: 'Operating Expenses', accountType: 'EXPENSE', accountSubType: 'OPERATING_EXPENSE' },
      { organizationId: org.id, code: '6010', name: 'Salaries & Wages', accountType: 'EXPENSE', accountSubType: 'OPERATING_EXPENSE' },
      { organizationId: org.id, code: '6020', name: 'Rent', accountType: 'EXPENSE', accountSubType: 'OPERATING_EXPENSE' },
      { organizationId: org.id, code: '6030', name: 'Utilities', accountType: 'EXPENSE', accountSubType: 'OPERATING_EXPENSE' },
    ],
  });

  console.log(`✅ Created ${accounts.count} chart of accounts`);

  // Create sample tax rates
  const taxRates = await prisma.taxRate.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Sales Tax 8.5%',
        code: 'ST',
        rate: 8.5,
        taxType: 'SALES_TAX',
        jurisdiction: 'New York, USA',
        isActive: true,
      },
      {
        organizationId: org.id,
        name: 'VAT 20%',
        code: 'VAT',
        rate: 20.0,
        taxType: 'VAT',
        jurisdiction: 'United Kingdom',
        isActive: true,
      },
    ],
  });

  console.log(`✅ Created ${taxRates.count} tax rates`);

  console.log('\n🎉 Accounting module seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

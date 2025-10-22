/**
 * Comprehensive Database Schema Validation
 * Checks all tables, columns, relationships, indexes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details?: string;
}

const results: ValidationResult[] = [];

async function validateDatabaseSchema() {
  console.log('🔍 Starting Comprehensive Database Validation...\n');

  // Required tables from schema
  const requiredTables = [
    'users', 'organization', 'products', 'customers', 'orders', 'order_items',
    'inventory', 'inventory_transactions', 'payments', 'shipping',
    'activities', 'notifications', 'support_tickets', 'reviews',
    'coupons', 'categories', 'tags', 'product_tags', 'product_images',
    'subscriptions', 'subscription_plans', 'invoices', 'invoice_items',
    'loyalty_points', 'loyalty_transactions', 'referrals', 'affiliate',
    'affiliate_commissions', 'campaigns', 'sms_logs', 'email_logs',
    'webhooks', 'webhook_logs', 'integrations', 'api_keys',
    'audit_logs', 'reports', 'report_schedules', 'exports',
    'configurations', 'sessions', 'verification_tokens', 'password_resets'
  ];

  // Test 1: Check if all required tables exist
  console.log('📋 Test 1: Checking Required Tables...');
  for (const table of requiredTables) {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists;
      `);
      
      const exists = (result as any)[0].exists;
      
      if (exists) {
        results.push({
          category: 'Tables',
          test: `Table: ${table}`,
          status: 'PASS'
        });
        console.log(`  ✅ ${table}`);
      } else {
        results.push({
          category: 'Tables',
          test: `Table: ${table}`,
          status: 'FAIL',
          details: 'Table does not exist'
        });
        console.log(`  ❌ ${table} - MISSING`);
      }
    } catch (error: any) {
      results.push({
        category: 'Tables',
        test: `Table: ${table}`,
        status: 'FAIL',
        details: error.message
      });
      console.log(`  ❌ ${table} - ERROR: ${error.message}`);
    }
  }

  // Test 2: Check database connection
  console.log('\n🔌 Test 2: Database Connection...');
  try {
    await prisma.$connect();
    results.push({
      category: 'Connection',
      test: 'Database connectivity',
      status: 'PASS'
    });
    console.log('  ✅ Database connected');
  } catch (error: any) {
    results.push({
      category: 'Connection',
      test: 'Database connectivity',
      status: 'FAIL',
      details: error.message
    });
    console.log(`  ❌ Connection failed: ${error.message}`);
  }

  // Test 3: Check critical columns in key tables
  console.log('\n📊 Test 3: Critical Columns Validation...');
  
  const criticalColumns = {
    users: ['id', 'email', 'name', 'role', 'organizationId'],
    products: ['id', 'name', 'sku', 'price', 'stock', 'organizationId'],
    orders: ['id', 'orderNumber', 'status', 'total', 'organizationId'],
    customers: ['id', 'email', 'name', 'phone', 'organizationId']
  };

  for (const [table, columns] of Object.entries(criticalColumns)) {
    for (const column of columns) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = '${table}' 
            AND column_name = '${column}'
          ) as exists;
        `);
        
        const exists = (result as any)[0].exists;
        
        if (exists) {
          results.push({
            category: 'Columns',
            test: `${table}.${column}`,
            status: 'PASS'
          });
          console.log(`  ✅ ${table}.${column}`);
        } else {
          results.push({
            category: 'Columns',
            test: `${table}.${column}`,
            status: 'FAIL',
            details: 'Column missing'
          });
          console.log(`  ❌ ${table}.${column} - MISSING`);
        }
      } catch (error: any) {
        results.push({
          category: 'Columns',
          test: `${table}.${column}`,
          status: 'FAIL',
          details: error.message
        });
      }
    }
  }

  // Test 4: Check indexes
  console.log('\n🔍 Test 4: Database Indexes...');
  try {
    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexCount = (indexes as any[]).length;
    results.push({
      category: 'Indexes',
      test: 'Index count',
      status: indexCount > 0 ? 'PASS' : 'WARN',
      details: `${indexCount} indexes found`
    });
    console.log(`  ✅ Found ${indexCount} indexes`);
  } catch (error: any) {
    results.push({
      category: 'Indexes',
      test: 'Index check',
      status: 'FAIL',
      details: error.message
    });
    console.log(`  ❌ Index check failed: ${error.message}`);
  }

  // Test 5: Check foreign key relationships
  console.log('\n🔗 Test 5: Foreign Key Relationships...');
  try {
    const fks = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `;
    
    const fkCount = (fks as any[]).length;
    results.push({
      category: 'Relationships',
      test: 'Foreign keys',
      status: fkCount > 0 ? 'PASS' : 'WARN',
      details: `${fkCount} foreign keys found`
    });
    console.log(`  ✅ Found ${fkCount} foreign key relationships`);
  } catch (error: any) {
    results.push({
      category: 'Relationships',
      test: 'Foreign keys',
      status: 'FAIL',
      details: error.message
    });
    console.log(`  ❌ Foreign key check failed: ${error.message}`);
  }

  // Test 6: Check if tables have data (basic sanity)
  console.log('\n📦 Test 6: Data Availability Check...');
  
  const dataChecks = ['users', 'organization', 'products', 'orders'];
  for (const table of dataChecks) {
    try {
      const count: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}";`);
      const recordCount = parseInt(count[0].count);
      
      results.push({
        category: 'Data',
        test: `${table} records`,
        status: recordCount > 0 ? 'PASS' : 'WARN',
        details: `${recordCount} records`
      });
      console.log(`  ${recordCount > 0 ? '✅' : '⚠️'} ${table}: ${recordCount} records`);
    } catch (error: any) {
      results.push({
        category: 'Data',
        test: `${table} records`,
        status: 'FAIL',
        details: error.message
      });
      console.log(`  ❌ ${table} - ERROR: ${error.message}`);
    }
  }

  // Test 7: Check multi-tenancy isolation (organizationId)
  console.log('\n🏢 Test 7: Multi-Tenancy Validation...');
  
  const multiTenantTables = ['products', 'orders', 'customers', 'users'];
  for (const table of multiTenantTables) {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = '${table}' 
          AND column_name = 'organizationId'
        ) as exists;
      `);
      
      const exists = (result as any)[0].exists;
      
      if (exists) {
        results.push({
          category: 'Multi-Tenancy',
          test: `${table}.organizationId`,
          status: 'PASS'
        });
        console.log(`  ✅ ${table}.organizationId exists`);
      } else {
        results.push({
          category: 'Multi-Tenancy',
          test: `${table}.organizationId`,
          status: 'FAIL',
          details: 'organizationId column missing'
        });
        console.log(`  ❌ ${table}.organizationId - MISSING`);
      }
    } catch (error: any) {
      results.push({
        category: 'Multi-Tenancy',
        test: `${table}.organizationId`,
        status: 'FAIL',
        details: error.message
      });
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const total = results.length;
  
  console.log(`✅ PASSED: ${passed}/${total}`);
  console.log(`❌ FAILED: ${failed}/${total}`);
  console.log(`⚠️  WARNED: ${warned}/${total}`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  - [${r.category}] ${r.test}: ${r.details || 'Failed'}`);
      });
  }
  
  if (warned > 0) {
    console.log('\n⚠️  WARNINGS:');
    results
      .filter(r => r.status === 'WARN')
      .forEach(r => {
        console.log(`  - [${r.category}] ${r.test}: ${r.details || 'Warning'}`);
      });
  }

  // Save results to file
  const fs = require('fs');
  const reportPath = 'test-results/database-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, warned },
    results
  }, null, 2));
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  await prisma.$disconnect();
  
  return { passed, failed, warned, total };
}

// Run validation
validateDatabaseSchema()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Validation error:', error);
    process.exit(1);
  });


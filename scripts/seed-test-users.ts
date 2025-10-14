#!/usr/bin/env ts-node
/**
 * Test User Seeder
 * 
 * Creates demo users for all 4 RBAC roles:
 * - SUPER_ADMIN
 * - TENANT_ADMIN
 * - STAFF (with multiple role tags)
 * - CUSTOMER
 * 
 * These users are used for:
 * - RBAC audit testing
 * - E2E tests
 * - Manual testing
 * - Demo purposes
 * 
 * Usage:
 *   ts-node scripts/seed-test-users.ts
 *   npm run db:seed:test-users
 */

import { PrismaClient, PlanType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'STAFF' | 'CUSTOMER';
  roleTag?: string;
  organizationId?: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'superadmin@smartstore.com',
    password: 'SuperAdmin123!',
    name: 'Super Administrator',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'admin@demo.com',
    password: 'Admin123!',
    name: 'Demo Admin',
    role: 'TENANT_ADMIN',
    organizationId: 'demo-org-1'
  },
  {
    email: 'sales@demo.com',
    password: 'Sales123!',
    name: 'Sales Staff',
    role: 'STAFF',
    roleTag: 'sales_staff',
    organizationId: 'demo-org-1'
  },
  {
    email: 'inventory@demo.com',
    password: 'Inventory123!',
    name: 'Inventory Manager',
    role: 'STAFF',
    roleTag: 'inventory_manager',
    organizationId: 'demo-org-1'
  },
  {
    email: 'support@demo.com',
    password: 'Support123!',
    name: 'Customer Service',
    role: 'STAFF',
    roleTag: 'customer_service',
    organizationId: 'demo-org-1'
  },
  {
    email: 'accountant@demo.com',
    password: 'Accountant123!',
    name: 'Accountant',
    role: 'STAFF',
    roleTag: 'accountant',
    organizationId: 'demo-org-1'
  },
  {
    email: 'customer@demo.com',
    password: 'Customer123!',
    name: 'Demo Customer',
    role: 'CUSTOMER',
    organizationId: 'demo-org-1'
  },
  // Secondary organization users for multi-tenant testing
  {
    email: 'admin@acme.com',
    password: 'Admin123!',
    name: 'Acme Admin',
    role: 'TENANT_ADMIN',
    organizationId: 'demo-org-2'
  },
  {
    email: 'customer@acme.com',
    password: 'Customer123!',
    name: 'Acme Customer',
    role: 'CUSTOMER',
    organizationId: 'demo-org-2'
  }
];

async function seedTestOrganizations() {
  console.log('📁 Seeding test organizations...');

  const orgs = [
    {
      id: 'demo-org-1',
      name: 'Demo Company',
      domain: 'demo.com',
      description: 'Primary demo organization',
      plan: PlanType.PRO,
      status: 'ACTIVE'
    },
    {
      id: 'demo-org-2',
      name: 'Acme Corporation',
      domain: 'acme.com',
      description: 'Secondary test organization',
      plan: PlanType.BASIC,
      status: 'ACTIVE'
    }
  ];

  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: org,
      create: org
    });
    console.log(`  ✓ ${org.name}`);
  }
}

async function seedTestUsers() {
  console.log('\n👥 Seeding test users...');

  for (const user of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        name: user.name,
        role: user.role,
        roleTag: user.roleTag,
        organizationId: user.organizationId,
        isActive: true,
        emailVerified: new Date()
      },
      create: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        role: user.role,
        roleTag: user.roleTag,
        organizationId: user.organizationId,
        isActive: true,
        emailVerified: new Date()
      }
    });

    console.log(`  ✓ ${user.name} (${user.email}) - ${user.role}${user.roleTag ? ` [${user.roleTag}]` : ''}`);
  }
}

async function createDemoCustomerRecords() {
  console.log('\n🛍️ Creating customer records...');

  const customerUsers = TEST_USERS.filter(u => u.role === 'CUSTOMER');

  for (const user of customerUsers) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser || !user.organizationId) continue;

    await prisma.customer.upsert({
      where: { id: dbUser.id },
      update: {
        name: user.name,
        email: user.email,
        organizationId: user.organizationId!
      },
      create: {
        id: dbUser.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId!,
        phone: '+1234567890',
        address: JSON.stringify({
          street: '123 Main St',
          city: 'Demo City',
          state: 'CA',
          zip: '90210',
          country: 'US'
        })
      }
    });

    // Create loyalty record
    await prisma.customerLoyalty.upsert({
      where: { id: dbUser.id },
      update: {
        points: 1000,
        tier: 'SILVER',
        totalSpent: 500
      },
      create: {
        id: dbUser.id,
        customerId: dbUser.id,
        points: 1000,
        tier: 'SILVER',
        totalSpent: 500,
        lastActivity: new Date()
      }
    });

    console.log(`  ✓ Customer record for ${user.name}`);
  }
}

async function printCredentials() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 TEST USER CREDENTIALS');
  console.log('='.repeat(80));

  console.log('\n📝 Copy these credentials for testing:\n');

  const roleGroups: Record<string, TestUser[]> = {
    'SUPER_ADMIN': [],
    'TENANT_ADMIN': [],
    'STAFF': [],
    'CUSTOMER': []
  };

  TEST_USERS.forEach(user => {
    const group = roleGroups[user.role];
    if (group) {
      group.push(user);
    }
  });

  for (const [role, users] of Object.entries(roleGroups)) {
    if (users.length === 0) continue;

    console.log(`\n${role}:`);
    console.log('-'.repeat(60));

    for (const user of users) {
      console.log(`  ${user.name}${user.roleTag ? ` [${user.roleTag}]` : ''}`);
      console.log(`    Email:    ${user.email}`);
      console.log(`    Password: ${user.password}`);
      if (user.organizationId) {
        console.log(`    Org:      ${user.organizationId}`);
      }
      console.log();
    }
  }

  console.log('='.repeat(80));
  console.log('\n✨ All test users created successfully!');
  console.log('\nYou can now:');
  console.log('  - Run RBAC audit: npm run audit:rbac');
  console.log('  - Run E2E tests: npm run test:e2e');
  console.log('  - Test login at: http://localhost:3000/login');
  console.log('='.repeat(80) + '\n');
}

async function main() {
  console.log('🚀 Starting test user seed...\n');

  try {
    await seedTestOrganizations();
    await seedTestUsers();
    await createDemoCustomerRecords();
    await printCredentials();

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { TEST_USERS, seedTestUsers, seedTestOrganizations };


import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting role-based user seeding...\n');

  try {
    // Create or find TechHub organization
    console.log('📊 Finding or creating TechHub organization...');
    let techHubOrg = await prisma.organization.findFirst({
      where: { domain: 'techhub.lk' }
    });
    
    if (!techHubOrg) {
      techHubOrg = await prisma.organization.create({
        data: {
          id: 'org-techhub',
          name: 'TechHub Solutions',
          domain: 'techhub.lk',
          description: 'Technology solutions and e-commerce platform',
          status: 'ACTIVE',
          plan: 'ENTERPRISE',
          settings: JSON.stringify({
            theme: 'dark',
            currency: 'LKR',
            timezone: 'Asia/Colombo',
            features: {
              analytics: true,
              aiInsights: true,
              multiChannel: true,
              whatsapp: true,
              courierManagement: true,
              loyaltyProgram: true,
              socialCommerce: true,
              notifications: true,
              wishlist: true,
              coupons: true,
              bulkOperations: true,
              multiLanguage: true,
            }
          })
        }
      });
      console.log(`✅ Created organization: ${techHubOrg.name}\n`);
    } else {
      console.log(`✅ Found existing organization: ${techHubOrg.name}\n`);
    }

    // Create or find SmartStore organization (for super admin)
    console.log('📊 Finding or creating SmartStore system organization...');
    let smartStoreOrg = await prisma.organization.findFirst({
      where: { domain: 'smartstore.com' }
    });
    
    if (!smartStoreOrg) {
      smartStoreOrg = await prisma.organization.create({
        data: {
          id: 'org-smartstore',
          name: 'SmartStore System',
          domain: 'smartstore.com',
          description: 'System administration organization',
          status: 'ACTIVE',
          plan: 'ENTERPRISE',
          settings: JSON.stringify({
            theme: 'dark',
            currency: 'USD',
            timezone: 'UTC',
          })
        }
      });
      console.log(`✅ Created organization: ${smartStoreOrg.name}\n`);
    } else {
      console.log(`✅ Found existing organization: ${smartStoreOrg.name}\n`);
    }

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const tenantPassword = await bcrypt.hash('password123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // 1. SUPER ADMIN - Full System Access
    console.log('👑 Creating SUPER_ADMIN user...');
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@smartstore.com' },
      update: {
        password: adminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      create: {
        email: 'superadmin@smartstore.com',
        name: 'Super Administrator',
        password: adminPassword,
        role: 'SUPER_ADMIN',
        organizationId: smartStoreOrg.id,
        isActive: true,
        emailVerified: new Date(),
        phone: '+1-555-0001',
        image: 'https://ui-avatars.com/api/?name=Super+Admin&background=DC2626&color=fff',
      }
    });
    console.log(`✅ Created: ${superAdmin.email}`);
    console.log(`   Role: SUPER_ADMIN`);
    console.log(`   Access: All 72 pages, System admin, Multi-tenant management\n`);

    // 2. TENANT ADMIN - Full Organization Access
    console.log('👨‍💼 Creating TENANT_ADMIN user...');
    const tenantAdmin = await prisma.user.upsert({
      where: { email: 'admin@techhub.lk' },
      update: {
        password: tenantPassword,
        role: 'TENANT_ADMIN',
        isActive: true,
      },
      create: {
        email: 'admin@techhub.lk',
        name: 'TechHub Administrator',
        password: tenantPassword,
        role: 'TENANT_ADMIN',
        organizationId: techHubOrg.id,
        isActive: true,
        emailVerified: new Date(),
        phone: '+94-77-1234567',
        image: 'https://ui-avatars.com/api/?name=Admin&background=2563EB&color=fff',
      }
    });
    console.log(`✅ Created: ${tenantAdmin.email}`);
    console.log(`   Role: TENANT_ADMIN`);
    console.log(`   Access: 63 pages, All business operations, User management\n`);

    // 3. STAFF - Limited Operations
    console.log('👷 Creating STAFF user...');
    const staff = await prisma.user.upsert({
      where: { email: 'staff@techhub.lk' },
      update: {
        password: staffPassword,
        role: 'STAFF',
        isActive: true,
      },
      create: {
        email: 'staff@techhub.lk',
        name: 'Staff Member',
        password: staffPassword,
        role: 'STAFF',
        roleTag: 'inventory_manager',
        organizationId: techHubOrg.id,
        isActive: true,
        emailVerified: new Date(),
        phone: '+94-77-7654321',
        image: 'https://ui-avatars.com/api/?name=Staff&background=059669&color=fff',
      }
    });
    console.log(`✅ Created: ${staff.email}`);
    console.log(`   Role: STAFF (inventory_manager)`);
    console.log(`   Access: 15-30 pages, Orders & Products, Limited operations\n`);

    // 4. CUSTOMER - Customer Portal Only
    console.log('🛍️ Creating CUSTOMER user...');
    const customer = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {
        password: customerPassword,
        role: 'CUSTOMER',
        isActive: true,
      },
      create: {
        email: 'customer@example.com',
        name: 'Demo Customer',
        password: customerPassword,
        role: 'CUSTOMER',
        organizationId: techHubOrg.id,
        isActive: true,
        emailVerified: new Date(),
        phone: '+94-77-9876543',
        image: 'https://ui-avatars.com/api/?name=Customer&background=7C3AED&color=fff',
      }
    });
    console.log(`✅ Created: ${customer.email}`);
    console.log(`   Role: CUSTOMER`);
    console.log(`   Access: 6 pages, My orders, Profile, Shop, Support\n`);

    // Create additional staff members with different role tags
    console.log('👥 Creating additional staff members with different role tags...');
    
    const staffRoles = [
      { email: 'sales@techhub.lk', name: 'Sales Executive', roleTag: 'sales_executive' },
      { email: 'finance@techhub.lk', name: 'Finance Officer', roleTag: 'finance_officer' },
      { email: 'marketing@techhub.lk', name: 'Marketing Manager', roleTag: 'marketing_manager' },
      { email: 'support@techhub.lk', name: 'Support Agent', roleTag: 'support_agent' },
    ];

    for (const staffRole of staffRoles) {
      const staffMember = await prisma.user.upsert({
        where: { email: staffRole.email },
        update: {
          password: staffPassword,
          role: 'STAFF',
          roleTag: staffRole.roleTag,
        },
        create: {
          email: staffRole.email,
          name: staffRole.name,
          password: staffPassword,
          role: 'STAFF',
          roleTag: staffRole.roleTag,
          organizationId: techHubOrg.id,
          isActive: true,
          emailVerified: new Date(),
          phone: `+94-77-${Math.floor(Math.random() * 9000000) + 1000000}`,
        }
      });
      console.log(`✅ Created: ${staffMember.email} (${staffRole.roleTag})`);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║              ✅ ROLE-BASED USERS CREATED!                    ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('🔐 Test Credentials Summary:\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ SUPER_ADMIN (System Administrator)                          │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Email:    superadmin@smartstore.com                         │');
    console.log('│ Password: admin123                                          │');
    console.log('│ Access:   All 72 pages, Multi-tenant management             │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ TENANT_ADMIN (Organization Owner)                           │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Email:    admin@techhub.lk                                  │');
    console.log('│ Password: password123                                       │');
    console.log('│ Access:   63 pages, Full organization control               │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ STAFF (Limited Operations)                                  │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Email:    staff@techhub.lk                                  │');
    console.log('│ Password: staff123                                          │');
    console.log('│ Access:   15-30 pages (role-based)                          │');
    console.log('│ RoleTag:  inventory_manager                                 │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ CUSTOMER (Customer Portal)                                  │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Email:    customer@example.com                              │');
    console.log('│ Password: customer123                                       │');
    console.log('│ Access:   6 pages (Customer portal only)                    │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');

    console.log('💡 Additional Staff Accounts:\n');
    console.log('   sales@techhub.lk / staff123 (sales_executive)');
    console.log('   finance@techhub.lk / staff123 (finance_officer)');
    console.log('   marketing@techhub.lk / staff123 (marketing_manager)');
    console.log('   support@techhub.lk / staff123 (support_agent)\n');

    console.log('✅ All role-based test users created successfully!');
    console.log('🚀 You can now test different role access levels on the login page\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });


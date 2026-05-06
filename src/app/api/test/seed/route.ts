import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Enforce security: Only allow in non-production/test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production environment' }, { status: 403 });
  }

  const prisma = new PrismaClient();

  try {
    const body = await request.json().catch(() => ({}));
    const seedType = body.seed || 'full';

    logger.info({ message: `🌱 [TEST API] Seeding database with type: ${seedType}...` });

    // Run the fullSeed.ts script programmatically
    execSync('npx tsx prisma/fullSeed.ts', {
      env: { ...process.env }
    });

    logger.info({ message: '✅ [TEST API] Baseline database seeded successfully. Seeding test users...' });

    // Fetch the first organization created by fullSeed
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('No organizations found after running baseline seed');
    }

    // Defining test users to match tests/e2e/fixtures/users.json
    const TEST_USERS = [
      {
        email: "superadmin+test@smartstore.test",
        name: "Super Admin Test",
        password: "SuperAdmin123!",
        role: "SUPER_ADMIN" as const,
        roleTag: null,
        organizationId: organization.id
      },
      {
        email: "admin+test@smartstore.test",
        name: "Tenant Admin Test",
        password: "TenantAdmin123!",
        role: "TENANT_ADMIN" as const,
        roleTag: null,
        organizationId: organization.id
      },
      {
        email: "staff.sales+test@smartstore.test",
        name: "Sales Staff Test",
        password: "StaffSales123!",
        role: "STAFF" as const,
        roleTag: "sales_staff",
        organizationId: organization.id
      },
      {
        email: "staff.inventory+test@smartstore.test",
        name: "Inventory Staff Test",
        password: "StaffInventory123!",
        role: "STAFF" as const,
        roleTag: "inventory_manager",
        organizationId: organization.id
      },
      {
        email: "customer+test@smartstore.test",
        name: "Customer Test",
        password: "Customer123!",
        role: "CUSTOMER" as const,
        roleTag: null,
        organizationId: organization.id
      }
    ];

    for (const u of TEST_USERS) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      
      const dbUser = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          password: hashedPassword,
          name: u.name,
          role: u.role,
          roleTag: u.roleTag,
          organizationId: u.organizationId,
          isActive: true,
          emailVerified: new Date()
        },
        create: {
          email: u.email,
          password: hashedPassword,
          name: u.name,
          role: u.role,
          roleTag: u.roleTag,
          organizationId: u.organizationId,
          isActive: true,
          emailVerified: new Date()
        }
      });

      // If the user is a CUSTOMER, also create a Customer record for them in the organization
      if (u.role === 'CUSTOMER') {
        await prisma.customer.upsert({
          where: { id: dbUser.id },
          update: {
            name: u.name,
            email: u.email,
            organizationId: u.organizationId
          },
          create: {
            id: dbUser.id,
            name: u.name,
            email: u.email,
            organizationId: u.organizationId,
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

        // Ensure customer has loyalty record
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
      }
    }

    logger.info({ message: '✅ [TEST API] Test users seeded successfully' });

    // Fetch tenant admin user we just seeded
    const tenantAdminUser = await prisma.user.findFirst({
      where: { role: 'TENANT_ADMIN', email: 'admin+test@smartstore.test' }
    });

    return NextResponse.json({
      success: true,
      organization: { id: organization.id, name: organization.name },
      user: tenantAdminUser ? { id: tenantAdminUser.id, email: tenantAdminUser.email } : null
    });
  } catch (error: any) {
    logger.error({ message: '❌ [TEST API] Seeding failed', error: error.message });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

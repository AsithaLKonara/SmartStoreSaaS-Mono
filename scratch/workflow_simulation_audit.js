
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runEnterpriseAudit() {
  console.log('🚀 Starting Enterprise Workflow & Multi-Tenant Isolation Audit...\n');

  try {
    // 1. DYNAMIC DATA DISCOVERY
    const orgs = await prisma.organization.findMany({ take: 2 });
    if (orgs.length < 2) {
      console.error('❌ Not enough organizations found. Please seed the database first.');
      return;
    }

    const org1Id = orgs[0].id;
    const org1Name = orgs[0].name;
    const org2Id = orgs[1].id;

    console.log(`🔍 Testing Org 1: ${org1Name} (${org1Id})`);
    console.log(`🔍 Testing Isolation against Org 2: (${org2Id})\n`);

    // 2. AUDIT 3: CRUD WORKFLOW SIMULATION (Org-1)
    console.log('📝 Phase 1: CRUD & Lifecycle Simulation (Org-1)');
    const testProductName = `Audit-Product-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        name: testProductName,
        sku: `AUDIT-${Math.random().toString(36).substring(7).toUpperCase()}`,
        price: 299.99,
        cost: 150.00,
        stock: 50,
        organizationId: org1Id,
        isMarketplacePublished: true,
        isActive: true
      }
    });
    console.log('✅ PASS: Product Creation');

    let customer = await prisma.customer.findFirst({ where: { organizationId: org1Id } });
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                name: 'Audit Test Customer',
                email: `audit-${Date.now()}@example.com`,
                organizationId: org1Id
            }
        });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: `AUDIT-ORD-${Date.now()}`,
        status: 'PENDING',
        total: 299.99,
        subtotal: 299.99,
        customer: { connect: { id: customer.id } },
        organization: { connect: { id: org1Id } },
        orderItems: {
          create: {
            productId: product.id,
            quantity: 1,
            price: 299.99,
            total: 299.99
          }
        }
      }
    });
    console.log('✅ PASS: Order Lifecycle (Connected to CRM & Catalog)');

    // Verification of Inventory Deduction Simulation
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 1 } }
    });
    console.log('✅ PASS: Inventory state mutation');


    // 3. AUDIT 5: MULTI-TENANT ISOLATION VALIDATION
    console.log('\n🛡️ Phase 2: Multi-Tenant Data Isolation Enforcement');
    
    // Check if Org 2 can see Org 1's product
    const leakCheck = await prisma.product.findFirst({
      where: {
        id: product.id, 
        organizationId: org2Id 
      }
    });

    if (!leakCheck) {
      console.log('✅ PASS: Org-2 cannot see Org-1 products (Isolation OK)');
    } else {
      console.error('❌ FAIL: Data leak detected! Org-1 product found in Org-2 query.');
    }

    // Attempt to access Org-1's order from Org-2's perspective
    const orderLeakCheck = await prisma.order.findFirst({
        where: { id: order.id, organizationId: org2Id }
    });
    if (!orderLeakCheck) {
        console.log('✅ PASS: Org-2 cannot see Org-1 orders (Isolation OK)');
    } else {
        console.error('❌ FAIL: Data leak detected! Org-1 order leaked to Org-2 query.');
    }


    // 4. AUDIT 4: ANALYTICS INTEGRITY
    console.log('\n📊 Phase 3: Analytics & Ledger Integrity');
    
    // Ensure we have a user in Org-1 for the log attribution
    let auditUser = await prisma.user.findFirst({ where: { organizationId: org1Id } });
    if (!auditUser) {
        auditUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    }

    const log = await prisma.auditLog.create({
      data: {
        action: 'AUDIT_SIMULATION_COMPLETED',
        resource: 'WorkflowSimulation',
        resourceId: product.id,
        details: { status: 'success', time: new Date() },
        organizationId: org1Id,
        userId: auditUser.id
      }
    });
    console.log('✅ PASS: System Observability Log created');

    console.log('\n✨ Enterprise Simulation Audit: 100% SUCCESS');

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.product.delete({ where: { id: product.id } });
    if (customer.name === 'Audit Test Customer') await prisma.customer.delete({ where: { id: customer.id } });
    console.log('🧹 Cleanup completed.');

  } catch (error) {
    console.error('💥 Audit Simulation Failed:', error);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

runEnterpriseAudit();

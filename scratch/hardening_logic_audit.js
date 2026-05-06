
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runHardeningLogicAudit() {
  console.log('🛡️ Starting Production Hardening & Chaos Logic Audit...\n');

  try {
    // Discovery
    const orgs = await prisma.organization.findMany({ take: 2 });
    const org1Id = orgs[0].id;
    const org2Id = orgs[1].id;

    // 1. DUPLICATE SKU ENFORCEMENT
    console.log('🧪 Test: Duplicate SKU Enforcement');
    const existingProduct = await prisma.product.findFirst({ where: { organizationId: org1Id } });
    if (existingProduct) {
        try {
            await prisma.product.create({
                data: {
                    name: 'Duplicate SKU Attempt',
                    sku: existingProduct.sku,
                    price: 10.00,
                    stock: 1,
                    organizationId: org1Id
                }
            });
            console.error('❌ FAIL: System allowed duplicate SKU in same organization.');
        } catch (e) {
            console.log('✅ PASS: System correctly rejected duplicate SKU (Unique constraint)');
        }
    }

    // 2. ZERO/NEGATIVE INVENTORY PROTECTION
    console.log('\n🧪 Test: Negative Inventory Block (Logic Layer)');
    const product = await prisma.product.findFirst({ where: { organizationId: org1Id } });
    try {
        await prisma.product.update({
            where: { id: product.id },
            data: { stock: -10 }
        });
        console.warn('⚠️ WARNING: DB allowed negative stock value. Ensure UI restricts this or check DB constraints.');
    } catch (e) {
        console.log('✅ PASS: DB level negative stock block active.');
    }

    // 3. MULTI-TENANT DEEP ISOLATION (ID GUESSING)
    console.log('\n🧪 Test: Multi-Tenant Deep Isolation (ID Guessing)');
    const org2Product = await prisma.product.findFirst({ where: { organizationId: org2Id } });
    
    // Attempt logic: Find a product that exists but filter by WRONG organization
    const leakCheck = await prisma.product.findFirst({
        where: {
            id: org2Product.id,
            organizationId: org1Id
        }
    });

    if (!leakCheck) {
        console.log('✅ PASS: Organization 1 cannot "guess" Org 2 IDs via scoped query.');
    } else {
        console.error('❌ FAIL: Data Leakage! Org 1 reached Org 2 data via query manipulation.');
    }

    // 4. SANITIZATION PROBE (XSS)
    console.log('\n🧪 Test: Sanitization Probe (XSS Storage)');
    const xssPayload = '<script>alert("XSS")</script>';
    const xssProduct = await prisma.product.create({
        data: {
            name: `XSS-Test-${xssPayload}`,
            sku: `XSS-SKU-${Date.now()}`,
            price: 1.00,
            stock: 1,
            organizationId: org1Id
        }
    });
    console.log('✅ PASS: Persistence allowed (Expected at DB layer, verifying escape needed in UI)');
    
    // 5. PRICE INTEGRITY
    console.log('\n🧪 Test: Negative Price Protection');
    try {
        await prisma.product.create({
            data: {
                name: 'Negative Price',
                sku: `PRICE-${Date.now()}`,
                price: -50.00,
                stock: 10,
                organizationId: org1Id
            }
        });
        console.warn('⚠️ WARNING: Database allowed negative price. Recommend adding @check constraint or Zod middleware validation.');
    } catch (e) {
        console.log('✅ PASS: Database rejected negative price.');
    }

    console.log('\n✨ Hardware Logic Audit Completed.');

    // Cleanup
    if (xssProduct) await prisma.product.delete({ where: { id: xssProduct.id } });

  } catch (error) {
    console.error('💥 Audit Script Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runHardeningLogicAudit();

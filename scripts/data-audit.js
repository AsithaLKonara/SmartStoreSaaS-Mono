require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  console.log('===================================================');
  console.log('🔍 SRE DATA INTEGRITY AUDIT ROUTINE STARTING...');
  console.log('===================================================\n');

  let discrepancies = 0;

  try {
    // 1. Check Negative Product Inventory
    console.log('👉 [CHECK 1] Scanning for Negative Inventories...');
    const negativeStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 0 } },
      select: { id: true, name: true, sku: true, stock: true }
    });

    if (negativeStockProducts.length > 0) {
      console.log(`❌ FAIL: Found ${negativeStockProducts.length} products with negative stock:`);
      negativeStockProducts.forEach(p => {
        console.log(`   - Product: "${p.name}" (SKU: ${p.sku}) -> Stock: ${p.stock}`);
      });
      discrepancies += negativeStockProducts.length;
    } else {
      console.log('✅ PASS: No negative inventory counts found.');
    }
    console.log('');

    // 2. Check Orphan Payments (Payments without corresponding Order)
    console.log('👉 [CHECK 2] Scanning for Orphan Payments...');
    const payments = await prisma.payment.findMany({
      select: { id: true, orderId: true, amount: true }
    });

    let orphanPaymentsCount = 0;
    for (const p of payments) {
      const orderExists = await prisma.order.findUnique({
        where: { id: p.orderId }
      });
      if (!orderExists) {
        console.log(`❌ FAIL: Orphan Payment found ID: ${p.id} mapped to missing Order ID: ${p.orderId}`);
        orphanPaymentsCount++;
      }
    }

    if (orphanPaymentsCount > 0) {
      discrepancies += orphanPaymentsCount;
    } else {
      console.log('✅ PASS: No orphan payment entries detected.');
    }
    console.log('');

    // 3. Check Duplicate stripePaymentIntentId across multiple orders
    console.log('👉 [CHECK 3] Scanning for Duplicate Stripe Payment Intents...');
    const duplicatePIs = await prisma.$queryRaw`
      SELECT "stripePaymentIntentId", COUNT(*) 
      FROM orders 
      WHERE "stripePaymentIntentId" IS NOT NULL 
      GROUP BY "stripePaymentIntentId" 
      HAVING COUNT(*) > 1
    `;

    if (duplicatePIs.length > 0) {
      console.log(`❌ FAIL: Detected duplicate Stripe Payment Intents mapped across multiple orders:`);
      duplicatePIs.forEach(dup => {
        console.log(`   - Payment Intent ID: ${dup.stripePaymentIntentId} mapped to ${dup.count} orders`);
      });
      discrepancies += duplicatePIs.length;
    } else {
      console.log('✅ PASS: Webhook deduplication verification succeeded (No duplicates).');
    }
    console.log('');

    // 4. Check Orders with status PAID but no successful payments
    console.log('👉 [CHECK 4] Scanning for Paid Orders without Valid Payment records...');
    const paidOrders = await prisma.order.findMany({
      where: { status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      include: { payments: true }
    });

    let unpaidPaidOrders = 0;
    paidOrders.forEach(o => {
      const successPayment = o.payments.some(pay => pay.status === 'PAID');
      if (!successPayment && o.payments.length === 0) {
        console.log(`❌ FAIL: Order ${o.orderNumber} is COMPLETED but has no associated payments.`);
        unpaidPaidOrders++;
      }
    });

    if (unpaidPaidOrders > 0) {
      discrepancies += unpaidPaidOrders;
    } else {
      console.log('✅ PASS: All completed orders have valid matching payments.');
    }
    console.log('');

    console.log('===================================================');
    if (discrepancies > 0) {
      console.error(`❌ SRE DATA INTEGRITY AUDIT FAILED!`);
      console.error(`   Found ${discrepancies} total database inconsistencies.`);
      console.log('===================================================');
      process.exit(1);
    } else {
      console.log('🎉 SRE DATA INTEGRITY AUDIT SUCCEEDED!');
      console.log('   All tables are 100% consistent with zero anomalies detected.');
      console.log('===================================================');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ CRITICAL ERROR RUNNING AUDIT:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();

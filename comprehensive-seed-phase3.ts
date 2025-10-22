import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 PHASE 3: Inventory, Variants & Advanced Features');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let total = 0;

  const products = await prisma.Product.findMany({ take: 50 });
  const warehouses = await prisma.Warehouse.findMany();
  const orders = await prisma.Order.findMany();
  const couriers = await prisma.Courier.findMany();
  const organizations = await prisma.Organization.findMany();

  // 11. ProductVariant (100 records - 2 per product)
  console.log('🔄 Creating product variants...');
  const variants = [];
  for (const product of products) {
    for (let i = 0; i < 2; i++) {
      const variant = await prisma.ProductVariant.create({
        data: {
          name: `${product.name} - ${i === 0 ? 'Standard' : 'Premium'}`,
          sku: `${product.sku}-${i === 0 ? 'STD' : 'PREM'}`,
          price: product.price,
          cost: product.cost || product.price,
          stock: Math.floor(Math.random() * 50) + 10,
          productId: product.id,
          organizationId: product.organizationId,
          isActive: true
        }
      });
      variants.push(variant);
      total++;
    }
  }
  console.log(`✅ Created ${variants.length} product variants`);

  // 12. InventoryMovement (50 records)
  console.log('📊 Creating inventory movements...');
  const movementTypes = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'];
  for (let i = 0; i < 50; i++) {
    const product = products[i % products.length];
    await prisma.InventoryMovement.create({
      data: {
        productId: product.id,
        variantId: variants[i * 2 % variants.length]?.id,
        type: movementTypes[i % movementTypes.length],
        quantity: Math.floor(Math.random() * 20) + 1,
        reason: `Movement ${i + 1}`,
        reference: `REF-${i + 1}`
      }
    });
    total++;
  }
  console.log(`✅ Created 50 inventory movements`);

  // 13. Delivery (50 records - 1 per order)
  console.log('🚚 Creating deliveries...');
  for (let i = 0; i < Math.min(50, orders.length); i++) {
    const courier = couriers[i % couriers.length];
    await prisma.Delivery.create({
      data: {
        orderId: orders[i].id,
        courierId: courier.id,
        trackingNumber: `TRK-${Date.now()}-${i}`,
        status: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'][i % 4],
        organizationId: orders[i].organizationId
      }
    });
    total++;
  }
  console.log(`✅ Created 50 deliveries`);

  // 14. OrderStatusHistory (100 records - 2 per order)
  console.log('📜 Creating order status history...');
  let historyCount = 0;
  for (const order of orders) {
    for (let i = 0; i < 2; i++) {
      await prisma.OrderStatusHistory.create({
        data: {
          orderId: order.id,
          status: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'][i],
          notes: `Status changed to ${i === 0 ? 'confirmed' : 'processing'}`,
          organizationId: order.organizationId
        }
      });
      historyCount++;
      total++;
    }
  }
  console.log(`✅ Created ${historyCount} order status history`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ PHASE 3 COMPLETE: ${total} new records`);
  console.log(`Total so far: ${125 + 234 + total} records`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


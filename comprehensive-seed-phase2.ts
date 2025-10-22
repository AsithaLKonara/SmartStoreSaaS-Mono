import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 PHASE 2: Orders, Payments & Logistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let total = 0;

  // Get existing data
  const organizations = await prisma.Organization.findMany();
  const customers = await prisma.Customer.findMany();
  const products = await prisma.Product.findMany();
  const users = await prisma.User.findMany();

  console.log(`Found: ${organizations.length} orgs, ${customers.length} customers, ${products.length} products`);
  console.log('');

  // 6. Orders (50 records)
  console.log('📋 Creating orders...');
  const orders = [];
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  for (let i = 0; i < 50; i++) {
    const customer = customers[i % customers.length];
    const order = await prisma.Order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i}`,
        customerId: customer.id,
        organizationId: customer.organizationId,
        status: statuses[i % statuses.length],
        total: String(Math.floor(Math.random() * 500000) + 5000),
        subtotal: String(Math.floor(Math.random() * 450000) + 5000),
        tax: String(Math.floor(Math.random() * 50000)),
        shipping: String(Math.floor(Math.random() * 2000)),
        discount: String(Math.floor(Math.random() * 10000)),
        notes: `Order ${i + 1}`
      }
    });
    orders.push(order);
    total++;
  }
  console.log(`✅ Created ${orders.length} orders`);

  // 7. OrderItems (100+ records - 2-3 per order)
  console.log('📦 Creating order items...');
  let orderItemCount = 0;
  for (const order of orders) {
    const itemCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < itemCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      await prisma.OrderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          price: product.price,
          total: String(Number(product.price) * quantity)
        }
      });
      orderItemCount++;
      total++;
    }
  }
  console.log(`✅ Created ${orderItemCount} order items`);

  // 8. Payments (50 records - 1 per order)
  console.log('💳 Creating payments...');
  const paymentMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE'];
  const paymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
  
  for (let i = 0; i < orders.length; i++) {
    await prisma.Payment.create({
      data: {
        orderId: orders[i].id,
        amount: orders[i].total,
        method: paymentMethods[i % paymentMethods.length],
        status: paymentStatuses[i % paymentStatuses.length],
        transactionId: `TXN-${Date.now()}-${i}`,
        organizationId: orders[i].organizationId
      }
    });
    total++;
  }
  console.log(`✅ Created ${orders.length} payments`);

  // 9. Warehouses (20 records - 2 per org)
  console.log('🏭 Creating warehouses...');
  let warehouseCount = 0;
  const warehouses = [];
  for (const org of organizations) {
    for (let i = 0; i < 2; i++) {
      const wh = await prisma.Warehouse.create({
        data: {
          name: `Warehouse ${i + 1} - ${org.name}`,
          address: `${i + 1} Industrial Zone, Colombo`,
          organizationId: org.id
        }
      });
      warehouses.push(wh);
      warehouseCount++;
      total++;
    }
  }
  console.log(`✅ Created ${warehouseCount} warehouses`);

  // 10. Couriers (15 records)
  console.log('🚚 Creating couriers...');
  const courierNames = ['DHL Lanka', 'FedEx', 'Pronto', 'Aramex', 'UPS', 
                        'Blue Dart', 'DTDC', 'Professional Couriers', 'EMS', 'TNT',
                        'Ceylon Post', 'Kapruka', 'Pickme Delivery', 'Uber Direct', 'Local Courier'];
  const couriers = [];
  const org1 = organizations[0];
  for (const name of courierNames) {
    const courier = await prisma.Courier.create({
      data: {
        name,
        email: `contact@${name.toLowerCase().replace(/\s+/g, '')}.lk`,
        phone: `+9411${Math.floor(Math.random() * 10000000)}`,
        organizationId: org1.id,
        isActive: true
      }
    });
    couriers.push(courier);
    total++;
  }
  console.log(`✅ Created ${couriers.length} couriers`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ PHASE 2 COMPLETE: ${total} new records`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


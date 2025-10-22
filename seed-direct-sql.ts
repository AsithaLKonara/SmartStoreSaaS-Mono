import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 DIRECT SQL SEEDING - Bypassing Schema Issues');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const org: any = (await prisma.$queryRaw`SELECT id FROM organizations LIMIT 1`)[0];
  const products: any[] = await prisma.$queryRaw`SELECT id FROM products LIMIT 10`;
  const customers: any[] = await prisma.$queryRaw`SELECT id FROM customers LIMIT 10`;
  const users: any[] = await prisma.$queryRaw`SELECT id FROM users LIMIT 5`;
  
  let total = 0;
  
  // SMS Templates
  console.log('📱 Seeding SMS templates...');
  try {
    await prisma.$executeRaw`
      INSERT INTO sms_templates (id, name, content, "organizationId", "createdAt", "updatedAt")
      VALUES 
        ('sms-t-1', 'Order Confirmation', 'Your order {orderNumber} confirmed', ${org.id}, NOW(), NOW()),
        ('sms-t-2', 'Delivery Update', 'Your order is on the way', ${org.id}, NOW(), NOW()),
        ('sms-t-3', 'Payment Receipt', 'Payment received: {amount}', ${org.id}, NOW(), NOW()),
        ('sms-t-4', 'Welcome Message', 'Welcome to our store!', ${org.id}, NOW(), NOW()),
        ('sms-t-5', 'Promo Alert', 'Special offer: {promo}', ${org.id}, NOW(), NOW()),
        ('sms-t-6', 'OTP Verification', 'Your OTP: {code}', ${org.id}, NOW(), NOW()),
        ('sms-t-7', 'Low Stock', 'Low stock alert: {product}', ${org.id}, NOW(), NOW()),
        ('sms-t-8', 'Birthday Wish', 'Happy Birthday {name}!', ${org.id}, NOW(), NOW()),
        ('sms-t-9', 'Cart Reminder', 'You have items in cart', ${org.id}, NOW(), NOW()),
        ('sms-t-10', 'Review Request', 'Please review {product}', ${org.id}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    total += 10;
    console.log('✅ Created 10 SMS templates');
  } catch (e) { console.log('⚠️ SMS templates: ' + (e as Error).message.split('\n')[0]); }

  // SMS Logs
  console.log('📲 Seeding SMS logs...');
  try {
    for (let i = 0; i < 10; i++) {
      await prisma.$executeRaw`
        INSERT INTO sms_logs (id, to, message, status, "organizationId", "sentAt", "createdAt")
        VALUES (
          ${`smslog-${i + 1}`},
          ${`+9477123456${i}`},
          ${'Test SMS ' + (i + 1)},
          ${['sent', 'delivered', 'failed'][i % 3]},
          ${org.id},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      total++;
    }
    console.log('✅ Created 10 SMS logs');
  } catch (e) { console.log('⚠️ SMS logs: ' + (e as Error).message.split('\n')[0]); }

  // Support Tickets
  console.log('🎫 Seeding support tickets...');
  try {
    for (let i = 0; i < 10; i++) {
      const customer = customers[i % customers.length];
      await prisma.$executeRaw`
        INSERT INTO support_tickets (id, "ticketNumber", subject, description, status, priority, "customerId", "organizationId", "createdAt", "updatedAt")
        VALUES (
          ${`ticket-${i + 1}`},
          ${'TKT-' + String(i + 1).padStart(5, '0')},
          ${'Support Issue ' + (i + 1)},
          ${'Customer needs help with ' + (i % 2 === 0 ? 'order' : 'product')},
          ${['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'][i % 4]},
          ${['LOW', 'MEDIUM', 'HIGH'][i % 3]},
          ${customer.id},
          ${org.id},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      total++;
    }
    console.log('✅ Created 10 support tickets');
  } catch (e) { console.log('⚠️ Support tickets: ' + (e as Error).message.split('\n')[0]); }

  // IoT Devices
  console.log('📡 Seeding IoT devices...');
  try {
    for (let i = 0; i < 10; i++) {
      await prisma.$executeRaw`
        INSERT INTO iot_devices (id, "deviceId", name, type, status, "organizationId", "createdAt", "updatedAt")
        VALUES (
          ${`iot-${i + 1}`},
          ${'IOT-' + String(i + 1).padStart(4, '0')},
          ${'Sensor ' + (i + 1)},
          ${['temperature', 'humidity', 'motion'][i % 3]},
          ${'active'},
          ${org.id},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      total++;
    }
    console.log('✅ Created 10 IoT devices');
  } catch (e) { console.log('⚠️ IoT devices: ' + (e as Error).message.split('\n')[0]); }

  // Integration Logs
  console.log('📝 Seeding integration logs...');
  try {
    for (let i = 0; i < 10; i++) {
      await prisma.$executeRaw`
        INSERT INTO integration_logs (id, type, action, status, message, "organizationId", "createdAt")
        VALUES (
          ${`intlog-${i + 1}`},
          ${['woocommerce', 'whatsapp', 'stripe'][i % 3]},
          ${['sync', 'webhook'][i % 2]},
          ${['success', 'failed'][i % 2]},
          ${'Integration log ' + (i + 1)},
          ${org.id},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      total++;
    }
    console.log('✅ Created 10 integration logs');
  } catch (e) { console.log('⚠️ Integration logs: ' + (e as Error).message.split('\n')[0]); }

  // Activities
  console.log('📋 Seeding activities...');
  try {
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      await prisma.$executeRaw`
        INSERT INTO activities (id, type, description, "userId", "organizationId", "createdAt")
        VALUES (
          ${`activity-${i + 1}`},
          ${['user_login', 'product_created', 'order_placed'][i % 3]},
          ${'Activity ' + (i + 1)},
          ${user.id},
          ${org.id},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      total++;
    }
    console.log('✅ Created 10 activities');
  } catch (e) { console.log('⚠️ Activities: ' + (e as Error).message.split('\n')[0]); }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ DIRECT SQL SEEDING COMPLETE - Created ${total} more records!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

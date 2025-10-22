import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 COMPREHENSIVE DATABASE SEEDING - PART 2 (Advanced Features)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Use raw queries to avoid enum mismatches
  const orgs: any[] = await prisma.$queryRaw`SELECT id, name FROM organizations LIMIT 1`;
  const org = orgs[0];
  const products: any[] = await prisma.$queryRaw`SELECT id, name, sku, price, "organizationId" FROM products LIMIT 10`;
  const customers: any[] = await prisma.$queryRaw`SELECT id, name, email, "organizationId" FROM customers LIMIT 7`;
  const users: any[] = await prisma.$queryRaw`SELECT id, name, email FROM users LIMIT 5`;

  if (!org) {
    console.log('❌ No organization found!');
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ADVANCED FEATURES (16 tables)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🚀 Seeding Advanced Features...');

  // Subscription (10 records)
  let subCount = 0;
  const allOrgs: any[] = await prisma.$queryRaw`SELECT id FROM organizations LIMIT 10`;
  const planTypes = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const statuses = ['ACTIVE', 'CANCELLED', 'PAUSED', 'TRIAL'];
  for (let i = 0; i < Math.min(10, allOrgs.length); i++) {
    try {
      await prisma.subscription.create({
        data: {
          organizationId: allOrgs[i].id,
          planType: planTypes[i % planTypes.length],
          status: statuses[i % statuses.length],
          startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
        }
      });
      subCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${subCount} subscriptions`);

  // iot_devices (10 records)
  let iotDeviceCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.iot_devices.create({
        data: {
          deviceId: `IOT-${String(i + 1).padStart(4, '0')}`,
          name: `Temperature Sensor ${i + 1}`,
          type: ['temperature', 'humidity', 'motion', 'door'][i % 4],
          status: 'active',
          organizationId: org.id
        }
      });
      iotDeviceCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${iotDeviceCount} IoT devices`);

  // iot_alerts (10 records)
  const iotDevices = await prisma.iot_devices.findMany({ take: 10 });
  let iotAlertCount = 0;
  for (let i = 0; i < Math.min(10, iotDevices.length); i++) {
    try {
      await prisma.iot_alerts.create({
        data: {
          deviceId: iotDevices[i].id,
          alertType: ['temperature_high', 'humidity_low', 'motion_detected'][i % 3],
          message: `Alert from device ${i + 1}`,
          severity: ['low', 'medium', 'high'][i % 3],
          organizationId: org.id
        }
      });
      iotAlertCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${iotAlertCount} IoT alerts`);

  // sensor_readings (10 records)
  let sensorCount = 0;
  for (const device of iotDevices.slice(0, 10)) {
    try {
      await prisma.sensor_readings.create({
        data: {
          deviceId: device.id,
          value: Math.random() * 100,
          unit: 'celsius',
          organizationId: org.id
        }
      });
      sensorCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${sensorCount} sensor readings`);

  // social_commerce (10 records)
  let socialCommerceCount = 0;
  const platforms = ['facebook', 'instagram', 'tiktok', 'pinterest'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.social_commerce.create({
        data: {
          platform: platforms[i % platforms.length],
          accountId: `account_${i + 1}`,
          isActive: true,
          organizationId: org.id
        }
      });
      socialCommerceCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${socialCommerceCount} social commerce accounts`);

  // social_posts (10 records)
  const socialAccounts = await prisma.social_commerce.findMany({ take: 10 });
  let socialPostCount = 0;
  for (let i = 0; i < Math.min(10, socialAccounts.length); i++) {
    try {
      await prisma.social_posts.create({
        data: {
          socialCommerceId: socialAccounts[i].id,
          postId: `post_${i + 1}`,
          content: `Social media post ${i + 1}`,
          status: 'published',
          organizationId: org.id
        }
      });
      socialPostCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${socialPostCount} social posts`);

  // social_products (10 records)
  let socialProductCount = 0;
  for (let i = 0; i < Math.min(10, socialAccounts.length); i++) {
    if (products.length > i) {
      try {
        await prisma.social_products.create({
          data: {
            socialCommerceId: socialAccounts[i].id,
            productId: products[i].id,
            externalId: `ext_${i + 1}`,
            organizationId: org.id
          }
        });
        socialProductCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${socialProductCount} social products`);

  // support_tickets (10 records)
  let ticketCount = 0;
  const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.support_tickets.create({
        data: {
          ticketNumber: `TKT-${String(i + 1).padStart(5, '0')}`,
          subject: `Support issue ${i + 1}`,
          description: `Customer needs help with ${i % 2 === 0 ? 'order' : 'product'}`,
          status: ticketStatuses[i % ticketStatuses.length],
          priority: priorities[i % priorities.length],
          customerId: customers[i % customers.length].id,
          organizationId: org.id
        }
      });
      ticketCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${ticketCount} support tickets`);

  // performance_metrics (10 records)
  let perfCount = 0;
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.performance_metrics.create({
        data: {
          metricType: ['api_response_time', 'page_load_time', 'database_query_time'][i % 3],
          value: Math.random() * 1000,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          organizationId: org.id
        }
      });
      perfCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${perfCount} performance metrics`);

  // activities (10 records)
  let activityCount = 0;
  const activityTypes = ['user_login', 'product_created', 'order_placed', 'customer_added', 'report_generated'];
  for (let i = 0; i < 10; i++) {
    try {
      await prisma.activities.create({
        data: {
          userId: users[i % users.length].id,
          action: activityTypes[i % activityTypes.length],
          entityType: 'order',
          entityId: `entity_${i}`,
          organizationId: org.id
        }
      });
      activityCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${activityCount} activities`);

  // product_activities (10 records)
  let prodActivityCount = 0;
  for (let i = 0; i < Math.min(10, products.length); i++) {
    try {
      await prisma.product_activities.create({
        data: {
          productId: products[i].id,
          action: ['view', 'add_to_cart', 'purchase'][i % 3],
          userId: users[i % users.length].id,
          organizationId: org.id
        }
      });
      prodActivityCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${prodActivityCount} product activities`);

  // Delivery (10 records)
  const orders = await prisma.order.findMany({ take: 10 });
  const couriers = await prisma.courier.findMany({ take: 3 });
  let deliveryCount = 0;
  for (let i = 0; i < Math.min(10, orders.length); i++) {
    if (couriers.length > 0) {
      try {
        await prisma.delivery.create({
          data: {
            orderId: orders[i].id,
            courierId: couriers[i % couriers.length].id,
            trackingNumber: `TRK${String(i + 1).padStart(10, '0')}`,
            status: ['PENDING', 'IN_TRANSIT', 'DELIVERED'][i % 3],
            organizationId: org.id
          }
        });
        deliveryCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${deliveryCount} deliveries`);

  // OrderStatusHistory (10 records)
  let orderHistoryCount = 0;
  for (let i = 0; i < Math.min(10, orders.length); i++) {
    const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    for (let s = 0; s < 2; s++) {
      try {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: orders[i].id,
            status: statuses[s],
            note: `Status changed to ${statuses[s]}`,
            organizationId: org.id
          }
        });
        orderHistoryCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${orderHistoryCount} order status history`);

  // delivery_status_history (10 records)
  const deliveries = await prisma.delivery.findMany({ take: 10 });
  let deliveryHistoryCount = 0;
  for (const delivery of deliveries) {
    const statuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];
    for (let s = 0; s < 2; s++) {
      try {
        await prisma.delivery_status_history.create({
          data: {
            deliveryId: delivery.id,
            status: statuses[s % statuses.length],
            location: `Location ${s + 1}`,
            organizationId: org.id
          }
        });
        deliveryHistoryCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ Created ${deliveryHistoryCount} delivery status history`);

  // sms_campaign_segments (10 records)
  const campaigns = await prisma.sms_campaigns.findMany({ take: 10 });
  const segments = await prisma.customer_segments.findMany({ take: 10 });
  let campaignSegmentCount = 0;
  for (let i = 0; i < Math.min(10, campaigns.length, segments.length); i++) {
    try {
      await prisma.sms_campaign_segments.create({
        data: {
          campaignId: campaigns[i].id,
          segmentId: segments[i].id
        }
      });
      campaignSegmentCount++;
    } catch (e) {}
  }
  console.log(`✅ Created ${campaignSegmentCount} campaign segments`);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ COMPREHENSIVE SEEDING COMPLETED - PART 2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


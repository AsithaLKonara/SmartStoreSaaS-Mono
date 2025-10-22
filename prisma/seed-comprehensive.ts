import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.currencyExchangeRate.deleteMany();
  await prisma.translation.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.pWASubscription.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.socialProduct.deleteMany();
  await prisma.socialCommerce.deleteMany();
  await prisma.whatsAppIntegration.deleteMany();
  await prisma.wooCommerceIntegration.deleteMany();
  await prisma.warehouseInventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.report.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.loyaltyCampaign.deleteMany();
  await prisma.loyaltyReward.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.customerLoyalty.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organizations (10)
  console.log('🏢 Creating organizations...');
  const organizations = [];
  for (let i = 1; i <= 10; i++) {
    const org = await prisma.organization.create({
      data: {
        name: `Organization ${i}`,
        slug: `org-${i}`,
        description: `Description for Organization ${i}`,
        plan: ['FREE', 'PRO', 'ENTERPRISE'][i % 3],
        isActive: true,
        settings: {
          theme: 'light',
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          features: {
            analytics: i > 3,
            integrations: i > 5,
            advancedReporting: i > 7
          }
        }
      }
    });
    organizations.push(org);
  }

  // 2. Create Users (10)
  console.log('👥 Creating users...');
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        name: `User ${i}`,
        password: await hash('password123', 12),
        image: `https://via.placeholder.com/150?text=U${i}`,
        role: ['ADMIN', 'STAFF', 'USER'][i % 3],
        isActive: true,
        organizationId: organizations[i % organizations.length].id
      }
    });
    users.push(user);
  }

  // 3. Create Categories (10)
  console.log('📂 Creating categories...');
  const categories = [];
  for (let i = 1; i <= 10; i++) {
    const category = await prisma.category.create({
      data: {
        name: `Category ${i}`,
        description: `Description for Category ${i}`,
        organizationId: organizations[i % organizations.length].id
      }
    });
    categories.push(category);
  }

  // 4. Create Products (10)
  console.log('🛍️ Creating products...');
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `Description for Product ${i}`,
        price: 1000 + (i * 100),
        sku: `SKU-${i.toString().padStart(3, '0')}`,
        stock: 50 + (i * 10),
        images: [
          `https://via.placeholder.com/300x300?text=Product${i}-1`,
          `https://via.placeholder.com/300x300?text=Product${i}-2`
        ],
        categoryId: categories[i % categories.length].id,
        organizationId: organizations[i % organizations.length].id,
        status: ['ACTIVE', 'INACTIVE', 'DRAFT'][i % 3]
      }
    });
    products.push(product);
  }

  // 5. Create Product Variants (10)
  console.log('🔧 Creating product variants...');
  const productVariants = [];
  for (let i = 1; i <= 10; i++) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: products[i % products.length].id,
        organizationId: organizations[i % organizations.length].id,
        name: ['Size', 'Color', 'Material'][i % 3],
        value: ['Small', 'Red', 'Cotton'][i % 3],
        price: 50 + (i * 10),
        sku: `VAR-${i.toString().padStart(3, '0')}`,
        stock: 20 + (i * 5),
        images: [`https://via.placeholder.com/200x200?text=Variant${i}`],
        isActive: true
      }
    });
    productVariants.push(variant);
  }

  // 6. Create Customers (10)
  console.log('👤 Creating customers...');
  const customers = [];
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        email: `customer${i}@example.com`,
        name: `Customer ${i}`,
        phone: `+9477${i.toString().padStart(7, '0')}`,
        address: {
          street: `${i} Main Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        organizationId: organizations[i % organizations.length].id,
        isActive: true
      }
    });
    customers.push(customer);
  }

  // 7. Create Customer Loyalty (10)
  console.log('💎 Creating customer loyalty...');
  const customerLoyalty = [];
  for (let i = 1; i <= 10; i++) {
    const loyalty = await prisma.customerLoyalty.create({
      data: {
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        points: 100 + (i * 50),
        tier: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i % 4],
        totalSpent: 5000 + (i * 1000),
        totalOrders: 5 + i,
        isActive: true
      }
    });
    customerLoyalty.push(loyalty);
  }

  // 8. Create Orders (10)
  console.log('📦 Creating orders...');
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${i.toString().padStart(6, '0')}`,
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        createdById: users[i % users.length].id,
        status: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'][i % 5],
        total: 2000 + (i * 500),
        currency: 'LKR',
        billingAddress: {
          street: `${i} Billing Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        shippingAddress: {
          street: `${i} Shipping Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        notes: `Order notes for order ${i}`
      }
    });
    orders.push(order);
  }

  // 9. Create Order Items (10)
  console.log('📋 Creating order items...');
  const orderItems = [];
  for (let i = 1; i <= 10; i++) {
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: orders[i % orders.length].id,
        productId: products[i % products.length].id,
        quantity: 1 + (i % 5),
        price: 1000 + (i * 100),
        total: (1 + (i % 5)) * (1000 + (i * 100))
      }
    });
    orderItems.push(orderItem);
  }

  // 10. Create Order Status History (10)
  console.log('📊 Creating order status history...');
  const orderStatusHistory = [];
  for (let i = 1; i <= 10; i++) {
    const statusHistory = await prisma.orderStatusHistory.create({
      data: {
        orderId: orders[i % orders.length].id,
        status: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'][i % 4],
        notes: `Status change notes for order ${i}`
      }
    });
    orderStatusHistory.push(statusHistory);
  }

  // 11. Create Payments (10)
  console.log('💳 Creating payments...');
  const payments = [];
  for (let i = 1; i <= 10; i++) {
    const payment = await prisma.payment.create({
      data: {
        orderId: orders[i % orders.length].id,
        organizationId: organizations[i % organizations.length].id,
        amount: 2000 + (i * 500),
        currency: 'LKR',
        method: ['CASH', 'CARD', 'BANK_TRANSFER', 'LANKAQR', 'COD'][i % 5],
        status: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'][i % 4],
        transactionId: `TXN-${i.toString().padStart(8, '0')}`
      }
    });
    payments.push(payment);
  }

  // 12. Create Couriers (10)
  console.log('🚚 Creating couriers...');
  const couriers = [];
  for (let i = 1; i <= 10; i++) {
    const courier = await prisma.courier.create({
      data: {
        name: `Courier Service ${i}`,
        phone: `+9477${i.toString().padStart(7, '0')}`,
        email: `courier${i}@example.com`,
        organizationId: organizations[i % organizations.length].id,
        isActive: true
      }
    });
    couriers.push(courier);
  }

  // 13. Create Deliveries (10)
  console.log('📦 Creating deliveries...');
  const deliveries = [];
  for (let i = 1; i <= 10; i++) {
    const delivery = await prisma.delivery.create({
      data: {
        orderId: orders[i % orders.length].id,
        organizationId: organizations[i % organizations.length].id,
        courierId: couriers[i % couriers.length].id,
        status: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'][i % 5],
        trackingNumber: `TRK-${i.toString().padStart(10, '0')}`,
        estimatedDelivery: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
        actualDelivery: i % 3 === 0 ? new Date(Date.now() + (i * 12 * 60 * 60 * 1000)) : null,
        notes: `Delivery notes for delivery ${i}`
      }
    });
    deliveries.push(delivery);
  }

  // 14. Create Delivery Status History (10)
  console.log('📊 Creating delivery status history...');
  const deliveryStatusHistory = [];
  for (let i = 1; i <= 10; i++) {
    const statusHistory = await prisma.deliveryStatusHistory.create({
      data: {
        deliveryId: deliveries[i % deliveries.length].id,
        status: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'][i % 4],
        notes: `Delivery status change notes for delivery ${i}`
      }
    });
    deliveryStatusHistory.push(statusHistory);
  }

  // 15. Create Inventory Movements (10)
  console.log('📦 Creating inventory movements...');
  const inventoryMovements = [];
  for (let i = 1; i <= 10; i++) {
    const movement = await prisma.inventoryMovement.create({
      data: {
        productId: products[i % products.length].id,
        organizationId: organizations[i % organizations.length].id,
        type: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'][i % 4],
        quantity: 10 + (i * 5),
        previousStock: 50 + (i * 10),
        newStock: 60 + (i * 15),
        reason: `Inventory movement reason ${i}`,
        reference: `REF-${i.toString().padStart(6, '0')}`,
        createdById: users[i % users.length].id
      }
    });
    inventoryMovements.push(movement);
  }

  // 16. Create Wishlists (10)
  console.log('❤️ Creating wishlists...');
  const wishlists = [];
  for (let i = 1; i <= 10; i++) {
    const wishlist = await prisma.wishlist.create({
      data: {
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        name: `Wishlist ${i}`,
        isPublic: i % 2 === 0,
        isDefault: i === 1
      }
    });
    wishlists.push(wishlist);
  }

  // 17. Create Wishlist Items (10)
  console.log('❤️ Creating wishlist items...');
  const wishlistItems = [];
  for (let i = 1; i <= 10; i++) {
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlists[i % wishlists.length].id,
        productId: products[i % products.length].id,
        quantity: 1 + (i % 3),
        notes: `Wishlist item notes ${i}`
      }
    });
    wishlistItems.push(wishlistItem);
  }

  // 18. Create Coupons (10)
  console.log('🎫 Creating coupons...');
  const coupons = [];
  for (let i = 1; i <= 10; i++) {
    const coupon = await prisma.coupon.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        code: `COUPON${i}`,
        name: `Coupon ${i}`,
        description: `Description for coupon ${i}`,
        type: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'][i % 3],
        value: 10 + (i * 5),
        minOrderAmount: 1000 + (i * 500),
        maxDiscount: 500 + (i * 100),
        usageLimit: 100 + (i * 10),
        usedCount: i * 5,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
      }
    });
    coupons.push(coupon);
  }

  // 19. Create Coupon Usage (10)
  console.log('🎫 Creating coupon usage...');
  const couponUsage = [];
  for (let i = 1; i <= 10; i++) {
    const usage = await prisma.couponUsage.create({
      data: {
        couponId: coupons[i % coupons.length].id,
        orderId: orders[i % orders.length].id,
        customerId: customers[i % customers.length].id
      }
    });
    couponUsage.push(usage);
  }

  // 20. Create Loyalty Transactions (10)
  console.log('💎 Creating loyalty transactions...');
  const loyaltyTransactions = [];
  for (let i = 1; i <= 10; i++) {
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        type: ['EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED'][i % 4],
        points: 50 + (i * 25),
        description: `Loyalty transaction description ${i}`,
        orderId: orders[i % orders.length].id
      }
    });
    loyaltyTransactions.push(transaction);
  }

  // 21. Create Loyalty Rewards (10)
  console.log('🎁 Creating loyalty rewards...');
  const loyaltyRewards = [];
  for (let i = 1; i <= 10; i++) {
    const reward = await prisma.loyaltyReward.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Reward ${i}`,
        description: `Description for reward ${i}`,
        pointsRequired: 100 + (i * 50),
        type: ['DISCOUNT', 'FREE_PRODUCT', 'FREE_SHIPPING'][i % 3],
        value: 100 + (i * 25),
        isActive: true
      }
    });
    loyaltyRewards.push(reward);
  }

  // 22. Create Loyalty Campaigns (10)
  console.log('🎯 Creating loyalty campaigns...');
  const loyaltyCampaigns = [];
  for (let i = 1; i <= 10; i++) {
    const campaign = await prisma.loyaltyCampaign.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Loyalty Campaign ${i}`,
        description: `Description for loyalty campaign ${i}`,
        type: ['BONUS_POINTS', 'MULTIPLIER', 'SPECIAL_REWARD'][i % 3],
        value: 1.5 + (i * 0.1),
        conditions: {
          minOrderAmount: 1000 + (i * 500),
          validProducts: [`Product ${i}`],
          validCategories: [`Category ${i}`]
        },
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000))
      }
    });
    loyaltyCampaigns.push(campaign);
  }

  // 23. Create Analytics (10)
  console.log('📊 Creating analytics...');
  const analytics = [];
  for (let i = 1; i <= 10; i++) {
    const analytic = await prisma.analytics.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        type: ['SALES', 'TRAFFIC', 'CONVERSION', 'CUSTOMER'][i % 4],
        metric: `metric_${i}`,
        value: 1000 + (i * 100),
        dimensions: {
          source: 'web',
          device: 'desktop',
          location: 'Colombo'
        },
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }
    });
    analytics.push(analytic);
  }

  // 24. Create Reports (10)
  console.log('📋 Creating reports...');
  const reports = [];
  for (let i = 1; i <= 10; i++) {
    const report = await prisma.report.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Report ${i}`,
        type: ['SALES', 'INVENTORY', 'CUSTOMER', 'CUSTOM'][i % 4],
        template: {
          columns: ['Date', 'Sales', 'Orders'],
          filters: { dateRange: '30d' }
        },
        data: {
          totalSales: 50000 + (i * 10000),
          totalOrders: 100 + (i * 20),
          averageOrderValue: 500 + (i * 50)
        },
        isScheduled: i % 2 === 0,
        schedule: i % 2 === 0 ? '0 9 * * *' : null,
        lastGenerated: i % 3 === 0 ? new Date() : null
      }
    });
    reports.push(report);
  }

  // 25. Create Warehouses (10)
  console.log('🏭 Creating warehouses...');
  const warehouses = [];
  for (let i = 1; i <= 10; i++) {
    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Warehouse ${i}`,
        address: {
          street: `${i} Warehouse Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        contactInfo: {
          phone: `+9477${i.toString().padStart(7, '0')}`,
          email: `warehouse${i}@example.com`
        },
        isActive: true
      }
    });
    warehouses.push(warehouse);
  }

  // 26. Create Warehouse Inventory (10)
  console.log('📦 Creating warehouse inventory...');
  const warehouseInventory = [];
  for (let i = 1; i <= 10; i++) {
    const inventory = await prisma.warehouseInventory.create({
      data: {
        warehouseId: warehouses[i % warehouses.length].id,
        productId: products[i % products.length].id,
        quantity: 100 + (i * 20),
        reserved: 10 + (i * 5)
      }
    });
    warehouseInventory.push(inventory);
  }

  // 27. Create WooCommerce Integrations (10)
  console.log('🛒 Creating WooCommerce integrations...');
  const wooCommerceIntegrations = [];
  for (let i = 1; i <= 10; i++) {
    const integration = await prisma.wooCommerceIntegration.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        storeUrl: `https://store${i}.example.com`,
        consumerKey: `ck_${i.toString().padStart(32, '0')}`,
        consumerSecret: `cs_${i.toString().padStart(43, '0')}`,
        isActive: true,
        lastSync: new Date(Date.now() - (i * 60 * 60 * 1000))
      }
    });
    wooCommerceIntegrations.push(integration);
  }

  // 28. Create WhatsApp Integrations (10)
  console.log('📱 Creating WhatsApp integrations...');
  const whatsappIntegrations = [];
  for (let i = 1; i <= 10; i++) {
    const integration = await prisma.whatsAppIntegration.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        phoneNumber: `+9477${i.toString().padStart(7, '0')}`,
        accessToken: `whatsapp_token_${i.toString().padStart(32, '0')}`,
        webhookUrl: `https://api.example.com/webhooks/whatsapp/${i}`,
        isActive: true
      }
    });
    whatsappIntegrations.push(integration);
  }

  // 29. Create Social Commerce (10)
  console.log('📱 Creating social commerce...');
  const socialCommerce = [];
  for (let i = 1; i <= 10; i++) {
    const social = await prisma.socialCommerce.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        platform: ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'PINTEREST'][i % 4],
        accountId: `account_${i}`,
        accessToken: `social_token_${i.toString().padStart(32, '0')}`,
        isActive: true
      }
    });
    socialCommerce.push(social);
  }

  // 30. Create Social Products (10)
  console.log('📱 Creating social products...');
  const socialProducts = [];
  for (let i = 1; i <= 10; i++) {
    const socialProduct = await prisma.socialProduct.create({
      data: {
        socialCommerceId: socialCommerce[i % socialCommerce.length].id,
        productId: products[i % products.length].id,
        socialProductId: `social_prod_${i}`,
        platform: ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'PINTEREST'][i % 4],
        isActive: true
      }
    });
    socialProducts.push(socialProduct);
  }

  // 31. Create Social Posts (10)
  console.log('📱 Creating social posts...');
  const socialPosts = [];
  for (let i = 1; i <= 10; i++) {
    const post = await prisma.socialPost.create({
      data: {
        socialCommerceId: socialCommerce[i % socialCommerce.length].id,
        content: `Social media post content ${i}`,
        media: [
          `https://via.placeholder.com/600x400?text=Post${i}-1`,
          `https://via.placeholder.com/600x400?text=Post${i}-2`
        ],
        platform: ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'PINTEREST'][i % 4],
        status: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'][i % 4],
        scheduledAt: i % 2 === 0 ? new Date(Date.now() + (i * 60 * 60 * 1000)) : null,
        publishedAt: i % 3 === 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)) : null
      }
    });
    socialPosts.push(post);
  }

  // 32. Create Device Tokens (10)
  console.log('📱 Creating device tokens...');
  const deviceTokens = [];
  for (let i = 1; i <= 10; i++) {
    const token = await prisma.deviceToken.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        token: `device_token_${i.toString().padStart(64, '0')}`,
        platform: ['IOS', 'ANDROID', 'WEB'][i % 3],
        isActive: true
      }
    });
    deviceTokens.push(token);
  }

  // 33. Create PWA Subscriptions (10)
  console.log('📱 Creating PWA subscriptions...');
  const pwaSubscriptions = [];
  for (let i = 1; i <= 10; i++) {
    const subscription = await prisma.pWASubscription.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        endpoint: `https://fcm.googleapis.com/fcm/send/subscription_${i}`,
        keys: {
          p256dh: `p256dh_key_${i.toString().padStart(88, '0')}`,
          auth: `auth_key_${i.toString().padStart(24, '0')}`
        },
        isActive: true
      }
    });
    pwaSubscriptions.push(subscription);
  }

  // 34. Create Campaigns (10)
  console.log('📢 Creating campaigns...');
  const campaigns = [];
  for (let i = 1; i <= 10; i++) {
    const campaign = await prisma.campaign.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Campaign ${i}`,
        type: ['EMAIL', 'SMS', 'PUSH', 'SOCIAL'][i % 4],
        subject: `Campaign Subject ${i}`,
        content: `Campaign content for campaign ${i}`,
        status: ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED'][i % 5],
        scheduledAt: i % 2 === 0 ? new Date(Date.now() + (i * 60 * 60 * 1000)) : null,
        startedAt: i % 3 === 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)) : null,
        completedAt: i % 4 === 0 ? new Date(Date.now() - (i * 30 * 60 * 1000)) : null
      }
    });
    campaigns.push(campaign);
  }

  // 35. Create Campaign Recipients (10)
  console.log('📢 Creating campaign recipients...');
  const campaignRecipients = [];
  for (let i = 1; i <= 10; i++) {
    const recipient = await prisma.campaignRecipient.create({
      data: {
        campaignId: campaigns[i % campaigns.length].id,
        customerId: customers[i % customers.length].id,
        email: `recipient${i}@example.com`,
        phone: `+9477${i.toString().padStart(7, '0')}`,
        status: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'][i % 5],
        sentAt: i % 2 === 0 ? new Date(Date.now() - (i * 30 * 60 * 1000)) : null,
        deliveredAt: i % 3 === 0 ? new Date(Date.now() - (i * 15 * 60 * 1000)) : null
      }
    });
    campaignRecipients.push(recipient);
  }

  // 36. Create Notifications (10)
  console.log('🔔 Creating notifications...');
  const notifications = [];
  for (let i = 1; i <= 10; i++) {
    const notification = await prisma.notification.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        title: `Notification ${i}`,
        message: `Notification message for notification ${i}`,
        type: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'][i % 4],
        isRead: i % 2 === 0,
        data: {
          action: 'view',
          url: `/notifications/${i}`
        }
      }
    });
    notifications.push(notification);
  }

  // 37. Create Notification Settings (10)
  console.log('🔔 Creating notification settings...');
  const notificationSettings = [];
  for (let i = 1; i <= 10; i++) {
    const settings = await prisma.notificationSettings.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        email: true,
        sms: i % 2 === 0,
        push: true,
        whatsapp: i % 3 === 0,
        types: {
          orders: true,
          promotions: i % 2 === 0,
          system: true
        }
      }
    });
    notificationSettings.push(settings);
  }

  // 38. Create API Keys (10)
  console.log('🔑 Creating API keys...');
  const apiKeys = [];
  for (let i = 1; i <= 10; i++) {
    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `API Key ${i}`,
        key: `api_key_${i.toString().padStart(32, '0')}`,
        permissions: {
          read: true,
          write: i % 2 === 0,
          admin: i % 5 === 0
        },
        isActive: true,
        lastUsed: i % 3 === 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)) : null,
        expiresAt: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))
      }
    });
    apiKeys.push(apiKey);
  }

  // 39. Create Rate Limits (10)
  console.log('⏱️ Creating rate limits...');
  const rateLimits = [];
  for (let i = 1; i <= 10; i++) {
    const rateLimit = await prisma.rateLimit.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        identifier: `identifier_${i}`,
        type: ['IP', 'API_KEY', 'USER'][i % 3],
        endpoint: `/api/endpoint${i}`,
        requests: 100 + (i * 10),
        windowStart: new Date(Date.now() - (i * 60 * 60 * 1000))
      }
    });
    rateLimits.push(rateLimit);
  }

  // 40. Create Translations (10)
  console.log('🌍 Creating translations...');
  const translations = [];
  for (let i = 1; i <= 10; i++) {
    const translation = await prisma.translation.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        key: `translation_key_${i}`,
        language: ['en', 'si', 'ta'][i % 3],
        value: `Translation value ${i}`,
        context: `Context for translation ${i}`
      }
    });
    translations.push(translation);
  }

  // 41. Create Currency Exchange Rates (10)
  console.log('💱 Creating currency exchange rates...');
  const currencyExchangeRates = [];
  for (let i = 1; i <= 10; i++) {
    const rate = await prisma.currencyExchangeRate.create({
      data: {
        fromCurrency: 'LKR',
        toCurrency: ['USD', 'EUR', 'GBP', 'JPY', 'AUD'][i % 5],
        rate: 0.003 + (i * 0.001),
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }
    });
    currencyExchangeRates.push(rate);
  }

  // 42. Create Audit Logs (10)
  console.log('📝 Creating audit logs...');
  const auditLogs = [];
  for (let i = 1; i <= 10; i++) {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        action: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'][i % 4],
        resource: ['USER', 'PRODUCT', 'ORDER', 'CUSTOMER'][i % 4],
        resourceId: `resource_${i}`,
        details: {
          changes: { field: 'value' },
          metadata: { ip: '192.168.1.1' }
        },
        ipAddress: `192.168.1.${i}`,
        userAgent: `Mozilla/5.0 (User Agent ${i})`
      }
    });
    auditLogs.push(auditLog);
  }

  console.log('✅ Comprehensive database seeding completed!');
  console.log(`📊 Created records:`);
  console.log(`   - Organizations: ${organizations.length}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Product Variants: ${productVariants.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Customer Loyalty: ${customerLoyalty.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Order Items: ${orderItems.length}`);
  console.log(`   - Order Status History: ${orderStatusHistory.length}`);
  console.log(`   - Payments: ${payments.length}`);
  console.log(`   - Couriers: ${couriers.length}`);
  console.log(`   - Deliveries: ${deliveries.length}`);
  console.log(`   - Delivery Status History: ${deliveryStatusHistory.length}`);
  console.log(`   - Inventory Movements: ${inventoryMovements.length}`);
  console.log(`   - Wishlists: ${wishlists.length}`);
  console.log(`   - Wishlist Items: ${wishlistItems.length}`);
  console.log(`   - Coupons: ${coupons.length}`);
  console.log(`   - Coupon Usage: ${couponUsage.length}`);
  console.log(`   - Loyalty Transactions: ${loyaltyTransactions.length}`);
  console.log(`   - Loyalty Rewards: ${loyaltyRewards.length}`);
  console.log(`   - Loyalty Campaigns: ${loyaltyCampaigns.length}`);
  console.log(`   - Analytics: ${analytics.length}`);
  console.log(`   - Reports: ${reports.length}`);
  console.log(`   - Warehouses: ${warehouses.length}`);
  console.log(`   - Warehouse Inventory: ${warehouseInventory.length}`);
  console.log(`   - WooCommerce Integrations: ${wooCommerceIntegrations.length}`);
  console.log(`   - WhatsApp Integrations: ${whatsappIntegrations.length}`);
  console.log(`   - Social Commerce: ${socialCommerce.length}`);
  console.log(`   - Social Products: ${socialProducts.length}`);
  console.log(`   - Social Posts: ${socialPosts.length}`);
  console.log(`   - Device Tokens: ${deviceTokens.length}`);
  console.log(`   - PWA Subscriptions: ${pwaSubscriptions.length}`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Campaign Recipients: ${campaignRecipients.length}`);
  console.log(`   - Notifications: ${notifications.length}`);
  console.log(`   - Notification Settings: ${notificationSettings.length}`);
  console.log(`   - API Keys: ${apiKeys.length}`);
  console.log(`   - Rate Limits: ${rateLimits.length}`);
  console.log(`   - Translations: ${translations.length}`);
  console.log(`   - Currency Exchange Rates: ${currencyExchangeRates.length}`);
  console.log(`   - Audit Logs: ${auditLogs.length}`);
  console.log(`\n🎉 Total: 420 records created across 42 collections!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.currencyExchangeRate.deleteMany();
  await prisma.translation.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.pWASubscription.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.socialProduct.deleteMany();
  await prisma.socialCommerce.deleteMany();
  await prisma.whatsAppIntegration.deleteMany();
  await prisma.wooCommerceIntegration.deleteMany();
  await prisma.warehouseInventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.report.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.loyaltyCampaign.deleteMany();
  await prisma.loyaltyReward.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.customerLoyalty.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organizations (10)
  console.log('🏢 Creating organizations...');
  const organizations = [];
  for (let i = 1; i <= 10; i++) {
    const org = await prisma.organization.create({
      data: {
        name: `Organization ${i}`,
        slug: `org-${i}`,
        description: `Description for Organization ${i}`,
        plan: ['FREE', 'PRO', 'ENTERPRISE'][i % 3],
        isActive: true,
        settings: {
          theme: 'light',
          currency: 'LKR',
          timezone: 'Asia/Colombo',
          features: {
            analytics: i > 3,
            integrations: i > 5,
            advancedReporting: i > 7
          }
        }
      }
    });
    organizations.push(org);
  }

  // 2. Create Users (10)
  console.log('👥 Creating users...');
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        name: `User ${i}`,
        password: await hash('password123', 12),
        image: `https://via.placeholder.com/150?text=U${i}`,
        role: ['ADMIN', 'STAFF', 'USER'][i % 3],
        isActive: true,
        organizationId: organizations[i % organizations.length].id
      }
    });
    users.push(user);
  }

  // 3. Create Categories (10)
  console.log('📂 Creating categories...');
  const categories = [];
  for (let i = 1; i <= 10; i++) {
    const category = await prisma.category.create({
      data: {
        name: `Category ${i}`,
        description: `Description for Category ${i}`,
        organizationId: organizations[i % organizations.length].id
      }
    });
    categories.push(category);
  }

  // 4. Create Products (10)
  console.log('🛍️ Creating products...');
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `Description for Product ${i}`,
        price: 1000 + (i * 100),
        sku: `SKU-${i.toString().padStart(3, '0')}`,
        stock: 50 + (i * 10),
        images: [
          `https://via.placeholder.com/300x300?text=Product${i}-1`,
          `https://via.placeholder.com/300x300?text=Product${i}-2`
        ],
        categoryId: categories[i % categories.length].id,
        organizationId: organizations[i % organizations.length].id,
        status: ['ACTIVE', 'INACTIVE', 'DRAFT'][i % 3]
      }
    });
    products.push(product);
  }

  // 5. Create Product Variants (10)
  console.log('🔧 Creating product variants...');
  const productVariants = [];
  for (let i = 1; i <= 10; i++) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: products[i % products.length].id,
        organizationId: organizations[i % organizations.length].id,
        name: ['Size', 'Color', 'Material'][i % 3],
        value: ['Small', 'Red', 'Cotton'][i % 3],
        price: 50 + (i * 10),
        sku: `VAR-${i.toString().padStart(3, '0')}`,
        stock: 20 + (i * 5),
        images: [`https://via.placeholder.com/200x200?text=Variant${i}`],
        isActive: true
      }
    });
    productVariants.push(variant);
  }

  // 6. Create Customers (10)
  console.log('👤 Creating customers...');
  const customers = [];
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        email: `customer${i}@example.com`,
        name: `Customer ${i}`,
        phone: `+9477${i.toString().padStart(7, '0')}`,
        address: {
          street: `${i} Main Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        organizationId: organizations[i % organizations.length].id,
        isActive: true
      }
    });
    customers.push(customer);
  }

  // 7. Create Customer Loyalty (10)
  console.log('💎 Creating customer loyalty...');
  const customerLoyalty = [];
  for (let i = 1; i <= 10; i++) {
    const loyalty = await prisma.customerLoyalty.create({
      data: {
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        points: 100 + (i * 50),
        tier: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i % 4],
        totalSpent: 5000 + (i * 1000),
        totalOrders: 5 + i,
        isActive: true
      }
    });
    customerLoyalty.push(loyalty);
  }

  // 8. Create Orders (10)
  console.log('📦 Creating orders...');
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${i.toString().padStart(6, '0')}`,
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        createdById: users[i % users.length].id,
        status: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'][i % 5],
        total: 2000 + (i * 500),
        currency: 'LKR',
        billingAddress: {
          street: `${i} Billing Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        shippingAddress: {
          street: `${i} Shipping Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        notes: `Order notes for order ${i}`
      }
    });
    orders.push(order);
  }

  // 9. Create Order Items (10)
  console.log('📋 Creating order items...');
  const orderItems = [];
  for (let i = 1; i <= 10; i++) {
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: orders[i % orders.length].id,
        productId: products[i % products.length].id,
        quantity: 1 + (i % 5),
        price: 1000 + (i * 100),
        total: (1 + (i % 5)) * (1000 + (i * 100))
      }
    });
    orderItems.push(orderItem);
  }

  // 10. Create Order Status History (10)
  console.log('📊 Creating order status history...');
  const orderStatusHistory = [];
  for (let i = 1; i <= 10; i++) {
    const statusHistory = await prisma.orderStatusHistory.create({
      data: {
        orderId: orders[i % orders.length].id,
        status: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'][i % 4],
        notes: `Status change notes for order ${i}`
      }
    });
    orderStatusHistory.push(statusHistory);
  }

  // 11. Create Payments (10)
  console.log('💳 Creating payments...');
  const payments = [];
  for (let i = 1; i <= 10; i++) {
    const payment = await prisma.payment.create({
      data: {
        orderId: orders[i % orders.length].id,
        organizationId: organizations[i % organizations.length].id,
        amount: 2000 + (i * 500),
        currency: 'LKR',
        method: ['CASH', 'CARD', 'BANK_TRANSFER', 'LANKAQR', 'COD'][i % 5],
        status: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'][i % 4],
        transactionId: `TXN-${i.toString().padStart(8, '0')}`
      }
    });
    payments.push(payment);
  }

  // 12. Create Couriers (10)
  console.log('🚚 Creating couriers...');
  const couriers = [];
  for (let i = 1; i <= 10; i++) {
    const courier = await prisma.courier.create({
      data: {
        name: `Courier Service ${i}`,
        phone: `+9477${i.toString().padStart(7, '0')}`,
        email: `courier${i}@example.com`,
        organizationId: organizations[i % organizations.length].id,
        isActive: true
      }
    });
    couriers.push(courier);
  }

  // 13. Create Deliveries (10)
  console.log('📦 Creating deliveries...');
  const deliveries = [];
  for (let i = 1; i <= 10; i++) {
    const delivery = await prisma.delivery.create({
      data: {
        orderId: orders[i % orders.length].id,
        organizationId: organizations[i % organizations.length].id,
        courierId: couriers[i % couriers.length].id,
        status: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'][i % 5],
        trackingNumber: `TRK-${i.toString().padStart(10, '0')}`,
        estimatedDelivery: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
        actualDelivery: i % 3 === 0 ? new Date(Date.now() + (i * 12 * 60 * 60 * 1000)) : null,
        notes: `Delivery notes for delivery ${i}`
      }
    });
    deliveries.push(delivery);
  }

  // 14. Create Delivery Status History (10)
  console.log('📊 Creating delivery status history...');
  const deliveryStatusHistory = [];
  for (let i = 1; i <= 10; i++) {
    const statusHistory = await prisma.deliveryStatusHistory.create({
      data: {
        deliveryId: deliveries[i % deliveries.length].id,
        status: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'][i % 4],
        notes: `Delivery status change notes for delivery ${i}`
      }
    });
    deliveryStatusHistory.push(statusHistory);
  }

  // 15. Create Inventory Movements (10)
  console.log('📦 Creating inventory movements...');
  const inventoryMovements = [];
  for (let i = 1; i <= 10; i++) {
    const movement = await prisma.inventoryMovement.create({
      data: {
        productId: products[i % products.length].id,
        organizationId: organizations[i % organizations.length].id,
        type: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'][i % 4],
        quantity: 10 + (i * 5),
        previousStock: 50 + (i * 10),
        newStock: 60 + (i * 15),
        reason: `Inventory movement reason ${i}`,
        reference: `REF-${i.toString().padStart(6, '0')}`,
        createdById: users[i % users.length].id
      }
    });
    inventoryMovements.push(movement);
  }

  // 16. Create Wishlists (10)
  console.log('❤️ Creating wishlists...');
  const wishlists = [];
  for (let i = 1; i <= 10; i++) {
    const wishlist = await prisma.wishlist.create({
      data: {
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        name: `Wishlist ${i}`,
        isPublic: i % 2 === 0,
        isDefault: i === 1
      }
    });
    wishlists.push(wishlist);
  }

  // 17. Create Wishlist Items (10)
  console.log('❤️ Creating wishlist items...');
  const wishlistItems = [];
  for (let i = 1; i <= 10; i++) {
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlists[i % wishlists.length].id,
        productId: products[i % products.length].id,
        quantity: 1 + (i % 3),
        notes: `Wishlist item notes ${i}`
      }
    });
    wishlistItems.push(wishlistItem);
  }

  // 18. Create Coupons (10)
  console.log('🎫 Creating coupons...');
  const coupons = [];
  for (let i = 1; i <= 10; i++) {
    const coupon = await prisma.coupon.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        code: `COUPON${i}`,
        name: `Coupon ${i}`,
        description: `Description for coupon ${i}`,
        type: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'][i % 3],
        value: 10 + (i * 5),
        minOrderAmount: 1000 + (i * 500),
        maxDiscount: 500 + (i * 100),
        usageLimit: 100 + (i * 10),
        usedCount: i * 5,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
      }
    });
    coupons.push(coupon);
  }

  // 19. Create Coupon Usage (10)
  console.log('🎫 Creating coupon usage...');
  const couponUsage = [];
  for (let i = 1; i <= 10; i++) {
    const usage = await prisma.couponUsage.create({
      data: {
        couponId: coupons[i % coupons.length].id,
        orderId: orders[i % orders.length].id,
        customerId: customers[i % customers.length].id
      }
    });
    couponUsage.push(usage);
  }

  // 20. Create Loyalty Transactions (10)
  console.log('💎 Creating loyalty transactions...');
  const loyaltyTransactions = [];
  for (let i = 1; i <= 10; i++) {
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId: customers[i % customers.length].id,
        organizationId: organizations[i % organizations.length].id,
        type: ['EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED'][i % 4],
        points: 50 + (i * 25),
        description: `Loyalty transaction description ${i}`,
        orderId: orders[i % orders.length].id
      }
    });
    loyaltyTransactions.push(transaction);
  }

  // 21. Create Loyalty Rewards (10)
  console.log('🎁 Creating loyalty rewards...');
  const loyaltyRewards = [];
  for (let i = 1; i <= 10; i++) {
    const reward = await prisma.loyaltyReward.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Reward ${i}`,
        description: `Description for reward ${i}`,
        pointsRequired: 100 + (i * 50),
        type: ['DISCOUNT', 'FREE_PRODUCT', 'FREE_SHIPPING'][i % 3],
        value: 100 + (i * 25),
        isActive: true
      }
    });
    loyaltyRewards.push(reward);
  }

  // 22. Create Loyalty Campaigns (10)
  console.log('🎯 Creating loyalty campaigns...');
  const loyaltyCampaigns = [];
  for (let i = 1; i <= 10; i++) {
    const campaign = await prisma.loyaltyCampaign.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Loyalty Campaign ${i}`,
        description: `Description for loyalty campaign ${i}`,
        type: ['BONUS_POINTS', 'MULTIPLIER', 'SPECIAL_REWARD'][i % 3],
        value: 1.5 + (i * 0.1),
        conditions: {
          minOrderAmount: 1000 + (i * 500),
          validProducts: [`Product ${i}`],
          validCategories: [`Category ${i}`]
        },
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000))
      }
    });
    loyaltyCampaigns.push(campaign);
  }

  // 23. Create Analytics (10)
  console.log('📊 Creating analytics...');
  const analytics = [];
  for (let i = 1; i <= 10; i++) {
    const analytic = await prisma.analytics.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        type: ['SALES', 'TRAFFIC', 'CONVERSION', 'CUSTOMER'][i % 4],
        metric: `metric_${i}`,
        value: 1000 + (i * 100),
        dimensions: {
          source: 'web',
          device: 'desktop',
          location: 'Colombo'
        },
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }
    });
    analytics.push(analytic);
  }

  // 24. Create Reports (10)
  console.log('📋 Creating reports...');
  const reports = [];
  for (let i = 1; i <= 10; i++) {
    const report = await prisma.report.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Report ${i}`,
        type: ['SALES', 'INVENTORY', 'CUSTOMER', 'CUSTOM'][i % 4],
        template: {
          columns: ['Date', 'Sales', 'Orders'],
          filters: { dateRange: '30d' }
        },
        data: {
          totalSales: 50000 + (i * 10000),
          totalOrders: 100 + (i * 20),
          averageOrderValue: 500 + (i * 50)
        },
        isScheduled: i % 2 === 0,
        schedule: i % 2 === 0 ? '0 9 * * *' : null,
        lastGenerated: i % 3 === 0 ? new Date() : null
      }
    });
    reports.push(report);
  }

  // 25. Create Warehouses (10)
  console.log('🏭 Creating warehouses...');
  const warehouses = [];
  for (let i = 1; i <= 10; i++) {
    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Warehouse ${i}`,
        address: {
          street: `${i} Warehouse Street`,
          city: 'Colombo',
          postalCode: `0${i}000`,
          country: 'Sri Lanka'
        },
        contactInfo: {
          phone: `+9477${i.toString().padStart(7, '0')}`,
          email: `warehouse${i}@example.com`
        },
        isActive: true
      }
    });
    warehouses.push(warehouse);
  }

  // 26. Create Warehouse Inventory (10)
  console.log('📦 Creating warehouse inventory...');
  const warehouseInventory = [];
  for (let i = 1; i <= 10; i++) {
    const inventory = await prisma.warehouseInventory.create({
      data: {
        warehouseId: warehouses[i % warehouses.length].id,
        productId: products[i % products.length].id,
        quantity: 100 + (i * 20),
        reserved: 10 + (i * 5)
      }
    });
    warehouseInventory.push(inventory);
  }

  // 27. Create WooCommerce Integrations (10)
  console.log('🛒 Creating WooCommerce integrations...');
  const wooCommerceIntegrations = [];
  for (let i = 1; i <= 10; i++) {
    const integration = await prisma.wooCommerceIntegration.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        storeUrl: `https://store${i}.example.com`,
        consumerKey: `ck_${i.toString().padStart(32, '0')}`,
        consumerSecret: `cs_${i.toString().padStart(43, '0')}`,
        isActive: true,
        lastSync: new Date(Date.now() - (i * 60 * 60 * 1000))
      }
    });
    wooCommerceIntegrations.push(integration);
  }

  // 28. Create WhatsApp Integrations (10)
  console.log('📱 Creating WhatsApp integrations...');
  const whatsappIntegrations = [];
  for (let i = 1; i <= 10; i++) {
    const integration = await prisma.whatsAppIntegration.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        phoneNumber: `+9477${i.toString().padStart(7, '0')}`,
        accessToken: `whatsapp_token_${i.toString().padStart(32, '0')}`,
        webhookUrl: `https://api.example.com/webhooks/whatsapp/${i}`,
        isActive: true
      }
    });
    whatsappIntegrations.push(integration);
  }

  // 29. Create Social Commerce (10)
  console.log('📱 Creating social commerce...');
  const socialCommerce = [];
  for (let i = 1; i <= 10; i++) {
    const social = await prisma.socialCommerce.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        platform: ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'PINTEREST'][i % 4],
        accountId: `account_${i}`,
        accessToken: `social_token_${i.toString().padStart(32, '0')}`,
        isActive: true
      }
    });
    socialCommerce.push(social);
  }

  // 30. Create Social Products (10)
  console.log('📱 Creating social products...');
  const socialProducts = [];
  for (let i = 1; i <= 10; i++) {
    const socialProduct = await prisma.socialProduct.create({
      data: {
        socialCommerceId: socialCommerce[i % socialCommerce.length].id,
        productId: products[i % products.length].id,
        socialProductId: `social_prod_${i}`,
        platform: ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'PINTEREST'][i % 4],
        isActive: true
      }
    });
    socialProducts.push(socialProduct);
  }

  // 31. Create Social Posts (10)
  console.log('📱 Creating social posts...');
  const socialPosts = [];
  for (let i = 1; i <= 10; i++) {
    const post = await prisma.socialPost.create({
      data: {
        socialCommerceId: socialCommerce[i % socialCommerce.length].id,
        content: `Social media post content ${i}`,
        media: [
          `https://via.placeholder.com/600x400?text=Post${i}-1`,
          `https://via.placeholder.com/600x400?text=Post${i}-2`
        ],
        platform: ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'PINTEREST'][i % 4],
        status: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'][i % 4],
        scheduledAt: i % 2 === 0 ? new Date(Date.now() + (i * 60 * 60 * 1000)) : null,
        publishedAt: i % 3 === 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)) : null
      }
    });
    socialPosts.push(post);
  }

  // 32. Create Device Tokens (10)
  console.log('📱 Creating device tokens...');
  const deviceTokens = [];
  for (let i = 1; i <= 10; i++) {
    const token = await prisma.deviceToken.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        token: `device_token_${i.toString().padStart(64, '0')}`,
        platform: ['IOS', 'ANDROID', 'WEB'][i % 3],
        isActive: true
      }
    });
    deviceTokens.push(token);
  }

  // 33. Create PWA Subscriptions (10)
  console.log('📱 Creating PWA subscriptions...');
  const pwaSubscriptions = [];
  for (let i = 1; i <= 10; i++) {
    const subscription = await prisma.pWASubscription.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        endpoint: `https://fcm.googleapis.com/fcm/send/subscription_${i}`,
        keys: {
          p256dh: `p256dh_key_${i.toString().padStart(88, '0')}`,
          auth: `auth_key_${i.toString().padStart(24, '0')}`
        },
        isActive: true
      }
    });
    pwaSubscriptions.push(subscription);
  }

  // 34. Create Campaigns (10)
  console.log('📢 Creating campaigns...');
  const campaigns = [];
  for (let i = 1; i <= 10; i++) {
    const campaign = await prisma.campaign.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `Campaign ${i}`,
        type: ['EMAIL', 'SMS', 'PUSH', 'SOCIAL'][i % 4],
        subject: `Campaign Subject ${i}`,
        content: `Campaign content for campaign ${i}`,
        status: ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED'][i % 5],
        scheduledAt: i % 2 === 0 ? new Date(Date.now() + (i * 60 * 60 * 1000)) : null,
        startedAt: i % 3 === 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)) : null,
        completedAt: i % 4 === 0 ? new Date(Date.now() - (i * 30 * 60 * 1000)) : null
      }
    });
    campaigns.push(campaign);
  }

  // 35. Create Campaign Recipients (10)
  console.log('📢 Creating campaign recipients...');
  const campaignRecipients = [];
  for (let i = 1; i <= 10; i++) {
    const recipient = await prisma.campaignRecipient.create({
      data: {
        campaignId: campaigns[i % campaigns.length].id,
        customerId: customers[i % customers.length].id,
        email: `recipient${i}@example.com`,
        phone: `+9477${i.toString().padStart(7, '0')}`,
        status: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'][i % 5],
        sentAt: i % 2 === 0 ? new Date(Date.now() - (i * 30 * 60 * 1000)) : null,
        deliveredAt: i % 3 === 0 ? new Date(Date.now() - (i * 15 * 60 * 1000)) : null
      }
    });
    campaignRecipients.push(recipient);
  }

  // 36. Create Notifications (10)
  console.log('🔔 Creating notifications...');
  const notifications = [];
  for (let i = 1; i <= 10; i++) {
    const notification = await prisma.notification.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        title: `Notification ${i}`,
        message: `Notification message for notification ${i}`,
        type: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'][i % 4],
        isRead: i % 2 === 0,
        data: {
          action: 'view',
          url: `/notifications/${i}`
        }
      }
    });
    notifications.push(notification);
  }

  // 37. Create Notification Settings (10)
  console.log('🔔 Creating notification settings...');
  const notificationSettings = [];
  for (let i = 1; i <= 10; i++) {
    const settings = await prisma.notificationSettings.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        email: true,
        sms: i % 2 === 0,
        push: true,
        whatsapp: i % 3 === 0,
        types: {
          orders: true,
          promotions: i % 2 === 0,
          system: true
        }
      }
    });
    notificationSettings.push(settings);
  }

  // 38. Create API Keys (10)
  console.log('🔑 Creating API keys...');
  const apiKeys = [];
  for (let i = 1; i <= 10; i++) {
    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        name: `API Key ${i}`,
        key: `api_key_${i.toString().padStart(32, '0')}`,
        permissions: {
          read: true,
          write: i % 2 === 0,
          admin: i % 5 === 0
        },
        isActive: true,
        lastUsed: i % 3 === 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)) : null,
        expiresAt: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))
      }
    });
    apiKeys.push(apiKey);
  }

  // 39. Create Rate Limits (10)
  console.log('⏱️ Creating rate limits...');
  const rateLimits = [];
  for (let i = 1; i <= 10; i++) {
    const rateLimit = await prisma.rateLimit.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        identifier: `identifier_${i}`,
        type: ['IP', 'API_KEY', 'USER'][i % 3],
        endpoint: `/api/endpoint${i}`,
        requests: 100 + (i * 10),
        windowStart: new Date(Date.now() - (i * 60 * 60 * 1000))
      }
    });
    rateLimits.push(rateLimit);
  }

  // 40. Create Translations (10)
  console.log('🌍 Creating translations...');
  const translations = [];
  for (let i = 1; i <= 10; i++) {
    const translation = await prisma.translation.create({
      data: {
        organizationId: organizations[i % organizations.length].id,
        key: `translation_key_${i}`,
        language: ['en', 'si', 'ta'][i % 3],
        value: `Translation value ${i}`,
        context: `Context for translation ${i}`
      }
    });
    translations.push(translation);
  }

  // 41. Create Currency Exchange Rates (10)
  console.log('💱 Creating currency exchange rates...');
  const currencyExchangeRates = [];
  for (let i = 1; i <= 10; i++) {
    const rate = await prisma.currencyExchangeRate.create({
      data: {
        fromCurrency: 'LKR',
        toCurrency: ['USD', 'EUR', 'GBP', 'JPY', 'AUD'][i % 5],
        rate: 0.003 + (i * 0.001),
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }
    });
    currencyExchangeRates.push(rate);
  }

  // 42. Create Audit Logs (10)
  console.log('📝 Creating audit logs...');
  const auditLogs = [];
  for (let i = 1; i <= 10; i++) {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: users[i % users.length].id,
        organizationId: organizations[i % organizations.length].id,
        action: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'][i % 4],
        resource: ['USER', 'PRODUCT', 'ORDER', 'CUSTOMER'][i % 4],
        resourceId: `resource_${i}`,
        details: {
          changes: { field: 'value' },
          metadata: { ip: '192.168.1.1' }
        },
        ipAddress: `192.168.1.${i}`,
        userAgent: `Mozilla/5.0 (User Agent ${i})`
      }
    });
    auditLogs.push(auditLog);
  }

  console.log('✅ Comprehensive database seeding completed!');
  console.log(`📊 Created records:`);
  console.log(`   - Organizations: ${organizations.length}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Product Variants: ${productVariants.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Customer Loyalty: ${customerLoyalty.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Order Items: ${orderItems.length}`);
  console.log(`   - Order Status History: ${orderStatusHistory.length}`);
  console.log(`   - Payments: ${payments.length}`);
  console.log(`   - Couriers: ${couriers.length}`);
  console.log(`   - Deliveries: ${deliveries.length}`);
  console.log(`   - Delivery Status History: ${deliveryStatusHistory.length}`);
  console.log(`   - Inventory Movements: ${inventoryMovements.length}`);
  console.log(`   - Wishlists: ${wishlists.length}`);
  console.log(`   - Wishlist Items: ${wishlistItems.length}`);
  console.log(`   - Coupons: ${coupons.length}`);
  console.log(`   - Coupon Usage: ${couponUsage.length}`);
  console.log(`   - Loyalty Transactions: ${loyaltyTransactions.length}`);
  console.log(`   - Loyalty Rewards: ${loyaltyRewards.length}`);
  console.log(`   - Loyalty Campaigns: ${loyaltyCampaigns.length}`);
  console.log(`   - Analytics: ${analytics.length}`);
  console.log(`   - Reports: ${reports.length}`);
  console.log(`   - Warehouses: ${warehouses.length}`);
  console.log(`   - Warehouse Inventory: ${warehouseInventory.length}`);
  console.log(`   - WooCommerce Integrations: ${wooCommerceIntegrations.length}`);
  console.log(`   - WhatsApp Integrations: ${whatsappIntegrations.length}`);
  console.log(`   - Social Commerce: ${socialCommerce.length}`);
  console.log(`   - Social Products: ${socialProducts.length}`);
  console.log(`   - Social Posts: ${socialPosts.length}`);
  console.log(`   - Device Tokens: ${deviceTokens.length}`);
  console.log(`   - PWA Subscriptions: ${pwaSubscriptions.length}`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Campaign Recipients: ${campaignRecipients.length}`);
  console.log(`   - Notifications: ${notifications.length}`);
  console.log(`   - Notification Settings: ${notificationSettings.length}`);
  console.log(`   - API Keys: ${apiKeys.length}`);
  console.log(`   - Rate Limits: ${rateLimits.length}`);
  console.log(`   - Translations: ${translations.length}`);
  console.log(`   - Currency Exchange Rates: ${currencyExchangeRates.length}`);
  console.log(`   - Audit Logs: ${auditLogs.length}`);
  console.log(`\n🎉 Total: 420 records created across 42 collections!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


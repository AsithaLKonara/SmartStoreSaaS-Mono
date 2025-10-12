import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random IDs
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to generate random dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random phone numbers
const randomPhone = () => `+94${Math.floor(Math.random() * 900000000) + 100000000}`;

// Helper function to generate random email
const randomEmail = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@${['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'][Math.floor(Math.random() * 4)]}`;

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await prisma.whatsapp_messages.deleteMany();
    await prisma.whatsapp_integrations.deleteMany();
    await prisma.warehouse_inventory.deleteMany();
    await prisma.warehouses.deleteMany();
    await prisma.iot_devices.deleteMany();
    await prisma.tax_transactions.deleteMany();
    await prisma.tax_rates.deleteMany();
    await prisma.reports.deleteMany();
    await prisma.activities.deleteMany();
    await prisma.ai_analytics.deleteMany();
    await prisma.ai_conversations.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.channel_integrations.deleteMany();
    await prisma.courier_deliveries.deleteMany();
    await prisma.courier_services.deleteMany();
    await prisma.courier_integrations.deleteMany();
    await prisma.customer_loyalty_programs.deleteMany();
    await prisma.customer_loyalty_points.deleteMany();
    await prisma.customer_segments.deleteMany();
    await prisma.customer_segment_memberships.deleteMany();
    await prisma.customers.deleteMany();
    await prisma.delivery_tracking.deleteMany();
    await prisma.deliveries.deleteMany();
    await prisma.discount_coupons.deleteMany();
    await prisma.employee_performance.deleteMany();
    await prisma.employees.deleteMany();
    await prisma.expense_categories.deleteMany();
    await prisma.expenses.deleteMany();
    await prisma.inventory_movements.deleteMany();
    await prisma.inventory_alerts.deleteMany();
    await prisma.marketing_campaigns.deleteMany();
    await prisma.marketing_automations.deleteMany();
    await prisma.marketing_segments.deleteMany();
    await prisma.marketing_templates.deleteMany();
    await prisma.notifications.deleteMany();
    await prisma.order_items.deleteMany();
    await prisma.orders.deleteMany();
    await prisma.payment_methods.deleteMany();
    await prisma.payments.deleteMany();
    await prisma.product_variants.deleteMany();
    await prisma.products.deleteMany();
    await prisma.categories.deleteMany();
    await prisma.users.deleteMany();
    await prisma.organizations.deleteMany();
    console.log('✅ Data cleared\n');

    // 1. Organizations (10 organizations)
    console.log('📊 Creating organizations...');
    const organizations = [];
    const orgNames = [
      'TechHub Electronics', 'Fashion Forward', 'Home & Garden Plus', 'Sports Central',
      'Book World', 'Toy Kingdom', 'Beauty Essentials', 'Auto Parts Pro',
      'Health & Wellness', 'Food & Beverage Co'
    ];
    
    for (let i = 0; i < 10; i++) {
      const org = await prisma.organizations.create({
        data: {
          id: `org-${i + 1}`,
          name: orgNames[i],
          domain: `${orgNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
          plan: i < 3 ? 'enterprise' : i < 7 ? 'professional' : 'starter',
          status: i < 8 ? 'ACTIVE' : 'INACTIVE',
          settings: JSON.stringify({
            currency: 'LKR',
            timezone: 'Asia/Colombo',
            language: 'en',
            theme: 'light'
          }),
          createdAt: randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31)),
          updatedAt: new Date()
        }
      });
      organizations.push(org);
    }
    console.log(`✅ Created ${organizations.length} organizations\n`);

    // 2. Users (50 users across all organizations)
    console.log('👥 Creating users...');
    const users = [];
    const roles = ['ADMIN', 'MANAGER', 'STAFF', 'USER'];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = randomEmail(name);
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.users.create({
        data: {
          id: generateId('user'),
          email,
          name,
          password: hashedPassword,
          role: roles[Math.floor(Math.random() * roles.length)],
          organizationId: organizations[Math.floor(Math.random() * organizations.length)].id,
          isActive: Math.random() > 0.1, // 90% active
          emailVerified: Math.random() > 0.2 ? new Date() : null,
          phone: randomPhone(),
          mfaEnabled: Math.random() > 0.7, // 30% have MFA enabled
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users\n`);

    // 3. Categories (30 categories)
    console.log('📂 Creating categories...');
    const categories = [];
    const categoryData = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Smartphones', description: 'Mobile phones and accessories', parent: 'Electronics' },
      { name: 'Laptops', description: 'Laptop computers and accessories', parent: 'Electronics' },
      { name: 'Clothing', description: 'Fashion and apparel' },
      { name: 'Men\'s Clothing', description: 'Men\'s fashion', parent: 'Clothing' },
      { name: 'Women\'s Clothing', description: 'Women\'s fashion', parent: 'Clothing' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Furniture', description: 'Home and office furniture', parent: 'Home & Garden' },
      { name: 'Kitchen', description: 'Kitchen appliances and utensils', parent: 'Home & Garden' },
      { name: 'Sports', description: 'Sports and fitness equipment' },
      { name: 'Fitness', description: 'Fitness equipment and accessories', parent: 'Sports' },
      { name: 'Outdoor', description: 'Outdoor sports and camping', parent: 'Sports' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Fiction', description: 'Fiction books', parent: 'Books' },
      { name: 'Non-Fiction', description: 'Non-fiction books', parent: 'Books' },
      { name: 'Toys', description: 'Toys and games' },
      { name: 'Educational Toys', description: 'Educational toys for children', parent: 'Toys' },
      { name: 'Action Figures', description: 'Action figures and collectibles', parent: 'Toys' },
      { name: 'Beauty', description: 'Beauty and personal care products' },
      { name: 'Skincare', description: 'Skincare products', parent: 'Beauty' },
      { name: 'Makeup', description: 'Makeup and cosmetics', parent: 'Beauty' },
      { name: 'Automotive', description: 'Automotive parts and accessories' },
      { name: 'Car Parts', description: 'Car parts and components', parent: 'Automotive' },
      { name: 'Motorcycle', description: 'Motorcycle parts and accessories', parent: 'Automotive' },
      { name: 'Health', description: 'Health and wellness products' },
      { name: 'Supplements', description: 'Health supplements', parent: 'Health' },
      { name: 'Medical', description: 'Medical supplies and equipment', parent: 'Health' },
      { name: 'Food', description: 'Food and beverages' },
      { name: 'Beverages', description: 'Drinks and beverages', parent: 'Food' },
      { name: 'Snacks', description: 'Snacks and treats', parent: 'Food' }
    ];

    for (const catData of categoryData) {
      const category = await prisma.categories.create({
        data: {
          id: generateId('cat'),
          name: catData.name,
          description: catData.description,
          parentId: catData.parent ? categories.find(c => c.name === catData.parent)?.id : null,
          isActive: true,
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
      categories.push(category);
    }
    console.log(`✅ Created ${categories.length} categories\n`);

    // 4. Products (200 products)
    console.log('🛍️ Creating products...');
    const products = [];
    const productNames = [
      'iPhone 15 Pro', 'Samsung Galaxy S24', 'MacBook Pro M3', 'Dell XPS 13',
      'Nike Air Max', 'Adidas Ultraboost', 'Levi\'s 501 Jeans', 'Zara Blazer',
      'IKEA Dining Table', 'Herman Miller Chair', 'KitchenAid Mixer', 'Dyson Vacuum',
      'Wilson Tennis Racket', 'Nike Basketball', 'Yoga Mat Pro', 'Camping Tent',
      'Harry Potter Collection', 'Programming Book', 'Cookbook Deluxe', 'History Textbook',
      'LEGO Creator Set', 'Barbie Dreamhouse', 'Puzzle 1000pcs', 'Board Game Classic',
      'L\'Oreal Foundation', 'Nivea Moisturizer', 'Chanel Perfume', 'Oral-B Toothbrush',
      'Car Battery', 'Motor Oil 5W-30', 'Brake Pads', 'Tire Pressure Gauge',
      'Multivitamin', 'Protein Powder', 'Blood Pressure Monitor', 'First Aid Kit',
      'Coffee Beans', 'Energy Drink', 'Protein Bar', 'Organic Tea'
    ];

    for (let i = 0; i < 200; i++) {
      const productName = productNames[Math.floor(Math.random() * productNames.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const createdBy = users.find(u => u.organizationId === organization.id) || users[0];

      const product = await prisma.products.create({
        data: {
          id: generateId('prod'),
          name: `${productName} ${i + 1}`,
          description: `High-quality ${productName.toLowerCase()} with excellent features and durability.`,
          sku: `SKU-${String(i + 1).padStart(6, '0')}`,
          price: Math.floor(Math.random() * 10000) + 100, // 100 to 10100
          currency: 'LKR',
          categoryId: category.id,
          organizationId: organization.id,
          status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
          inventory: JSON.stringify({
            quantity: Math.floor(Math.random() * 1000) + 10,
            lowStockThreshold: 20,
            trackInventory: true
          }),
          images: JSON.stringify([
            `https://example.com/images/${productName.toLowerCase().replace(/\s+/g, '-')}-1.jpg`,
            `https://example.com/images/${productName.toLowerCase().replace(/\s+/g, '-')}-2.jpg`
          ]),
          tags: JSON.stringify([category.name, 'popular', 'trending']),
          weight: Math.floor(Math.random() * 5000) + 100, // 100g to 5kg
          dimensions: JSON.stringify({
            length: Math.floor(Math.random() * 50) + 10,
            width: Math.floor(Math.random() * 30) + 5,
            height: Math.floor(Math.random() * 20) + 2
          }),
          seoTitle: `${productName} - Best Quality at Affordable Price`,
          seoDescription: `Shop the best ${productName.toLowerCase()} with free shipping and warranty.`,
          createdById: createdBy.id,
          updatedById: createdBy.id,
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products\n`);

    // 5. Customers (100 customers)
    console.log('👤 Creating customers...');
    const customers = [];
    const customerFirstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const customerLastNames = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Green', 'Harris', 'Irwin', 'Johnson'];

    for (let i = 0; i < 100; i++) {
      const firstName = customerFirstNames[Math.floor(Math.random() * customerFirstNames.length)];
      const lastName = customerLastNames[Math.floor(Math.random() * customerLastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = randomEmail(name);
      const organization = organizations[Math.floor(Math.random() * organizations.length)];

      const customer = await prisma.customers.create({
        data: {
          id: generateId('cust'),
          email,
          name,
          phone: randomPhone(),
          address: JSON.stringify({
            street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
            city: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo'][Math.floor(Math.random() * 5)],
            state: 'Western Province',
            country: 'Sri Lanka',
            postalCode: `${Math.floor(Math.random() * 90000) + 10000}`
          }),
          organizationId: organization.id,
          status: Math.random() > 0.15 ? 'ACTIVE' : 'INACTIVE',
          totalOrders: Math.floor(Math.random() * 50),
          totalSpent: Math.floor(Math.random() * 100000) + 1000,
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers\n`);

    // 6. Orders (500 orders)
    console.log('📦 Creating orders...');
    const orders = [];
    const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

    for (let i = 0; i < 500; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const organization = organizations.find(o => o.id === customer.organizationId);
      const createdBy = users.find(u => u.organizationId === organization?.id) || users[0];
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentStatus = paymentStatusesList[Math.floor(Math.random() * paymentStatusesList.length)];

      const order = await prisma.orders.create({
        data: {
          id: generateId('order'),
          orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
          customerId: customer.id,
          organizationId: customer.organizationId,
          status: orderStatus,
          paymentStatus: paymentStatus,
          subtotal: Math.floor(Math.random() * 50000) + 1000,
          tax: Math.floor(Math.random() * 5000) + 100,
          shipping: Math.floor(Math.random() * 2000) + 200,
          total: Math.floor(Math.random() * 60000) + 1500,
          currency: 'LKR',
          shippingAddress: customer.address,
          billingAddress: customer.address,
          notes: Math.random() > 0.7 ? 'Special delivery instructions' : null,
          createdById: createdBy.id,
          updatedById: createdBy.id,
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
      orders.push(order);
    }
    console.log(`✅ Created ${orders.length} orders\n`);

    // 7. Order Items (1000 order items)
    console.log('📋 Creating order items...');
    for (let i = 0; i < 1000; i++) {
      const order = orders[Math.floor(Math.random() * orders.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;

      await prisma.order_items.create({
        data: {
          id: generateId('item'),
          orderId: order.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          createdAt: order.createdAt,
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 1000 order items\n');

    // 8. Payments (400 payments)
    console.log('💳 Creating payments...');
    const paymentMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'DIGITAL_WALLET'];
    const paymentStatusesList = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

    for (let i = 0; i < 400; i++) {
      const order = orders[Math.floor(Math.random() * orders.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const paymentStatus = paymentStatusesList[Math.floor(Math.random() * paymentStatusesList.length)];

      await prisma.payments.create({
        data: {
          id: generateId('pay'),
          orderId: order.id,
          organizationId: order.organizationId,
          amount: order.total,
          currency: 'LKR',
          method: paymentMethod,
          status: paymentStatus,
          transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          gateway: paymentMethod === 'CREDIT_CARD' ? 'stripe' : 'bank',
          gatewayResponse: JSON.stringify({ status: 'success', code: '200' }),
          createdAt: randomDate(order.createdAt, new Date()),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 400 payments\n');

    // 9. Analytics (200 analytics records)
    console.log('📊 Creating analytics...');
    const analyticsTypes = ['page_view', 'product_view', 'add_to_cart', 'purchase', 'user_registration', 'email_click'];

    for (let i = 0; i < 200; i++) {
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const analyticsType = analyticsTypes[Math.floor(Math.random() * analyticsTypes.length)];

      await prisma.analytics.create({
        data: {
          id: generateId('analytics'),
          type: analyticsType,
          value: Math.floor(Math.random() * 1000) + 1,
          metadata: JSON.stringify({
            page: '/products',
            userAgent: 'Mozilla/5.0...',
            referrer: 'https://google.com'
          }),
          organizationId: organization.id,
          createdAt: randomDate(new Date(2020, 0, 1), new Date())
        }
      });
    }
    console.log('✅ Created 200 analytics records\n');

    // 10. Activities (150 activities)
    console.log('📝 Creating activities...');
    const activityTypes = ['user_login', 'product_created', 'order_placed', 'payment_received', 'customer_registered'];

    for (let i = 0; i < 150; i++) {
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const user = users.find(u => u.organizationId === organization.id) || users[0];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

      await prisma.activities.create({
        data: {
          id: generateId('activity'),
          type: activityType,
          description: `${activityType.replace(/_/g, ' ')} activity performed`,
          userId: user.id,
          organizationId: organization.id,
          metadata: JSON.stringify({
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date().toISOString()
          }),
          createdAt: randomDate(new Date(2020, 0, 1), new Date())
        }
      });
    }
    console.log('✅ Created 150 activities\n');

    // 11. Warehouses (20 warehouses)
    console.log('🏭 Creating warehouses...');
    const warehouses = [];
    const warehouseNames = ['Main Warehouse', 'Secondary Storage', 'Cold Storage', 'Electronics Hub', 'Fashion Center'];

    for (let i = 0; i < 20; i++) {
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const warehouseName = `${warehouseNames[Math.floor(Math.random() * warehouseNames.length)]} ${i + 1}`;

      const warehouse = await prisma.warehouses.create({
        data: {
          id: generateId('warehouse'),
          name: warehouseName,
          address: `${Math.floor(Math.random() * 999) + 1} Industrial Road, Colombo ${Math.floor(Math.random() * 15) + 1}`,
          organizationId: organization.id,
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
      warehouses.push(warehouse);
    }
    console.log(`✅ Created ${warehouses.length} warehouses\n`);

    // 12. Warehouse Inventory (500 inventory records)
    console.log('📦 Creating warehouse inventory...');
    for (let i = 0; i < 500; i++) {
      const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
      const product = products[Math.floor(Math.random() * products.length)];

      await prisma.warehouse_inventory.create({
        data: {
          id: generateId('inv'),
          warehouseId: warehouse.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 1000) + 10,
          reservedQuantity: Math.floor(Math.random() * 50),
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 500 warehouse inventory records\n');

    // 13. WhatsApp Integrations (5 integrations)
    console.log('📱 Creating WhatsApp integrations...');
    for (let i = 0; i < 5; i++) {
      const organization = organizations[Math.floor(Math.random() * organizations.length)];

      await prisma.whatsapp_integrations.create({
        data: {
          id: generateId('whatsapp'),
          organizationId: organization.id,
          phoneNumber: `+9477${Math.floor(Math.random() * 9000000) + 1000000}`,
          accessToken: `token_${Math.random().toString(36).substr(2, 20)}`,
          isActive: Math.random() > 0.2,
          lastSync: randomDate(new Date(2020, 0, 1), new Date()),
          syncSettings: JSON.stringify({
            autoReply: true,
            businessHours: '9:00-17:00',
            timezone: 'Asia/Colombo'
          }),
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 5 WhatsApp integrations\n');

    // 14. WhatsApp Messages (100 messages)
    console.log('💬 Creating WhatsApp messages...');
    for (let i = 0; i < 100; i++) {
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const customer = customers.find(c => c.organizationId === organization.id) || customers[0];
      const messageTypes = ['text', 'image', 'document', 'audio'];
      const directions = ['INBOUND', 'OUTBOUND'];
      const statuses = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'];

      await prisma.whatsapp_messages.create({
        data: {
          id: generateId('msg'),
          organizationId: organization.id,
          customerId: customer.id,
          phoneNumber: customer.phone,
          message: `Sample message ${i + 1}: Hello, how can I help you today?`,
          type: messageTypes[Math.floor(Math.random() * messageTypes.length)],
          mediaUrl: Math.random() > 0.7 ? `https://example.com/media/${i + 1}.jpg` : null,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          direction: directions[Math.floor(Math.random() * directions.length)],
          externalId: `ext_${Math.random().toString(36).substr(2, 15)}`,
          isAutoReply: Math.random() > 0.6,
          receivedAt: randomDate(new Date(2020, 0, 1), new Date()),
          sentAt: randomDate(new Date(2020, 0, 1), new Date()),
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 100 WhatsApp messages\n');

    // 15. Reports (50 reports)
    console.log('📊 Creating reports...');
    const reportTypes = ['sales', 'inventory', 'customer', 'financial', 'marketing'];
    const reportStatuses = ['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED'];

    for (let i = 0; i < 50; i++) {
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const user = users.find(u => u.organizationId === organization.id) || users[0];
      const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      const reportStatus = reportStatuses[Math.floor(Math.random() * reportStatuses.length)];

      await prisma.reports.create({
        data: {
          id: generateId('report'),
          name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report ${i + 1}`,
          type: reportType,
          status: reportStatus,
          organizationId: organization.id,
          userId: user.id,
          parameters: JSON.stringify({
            dateRange: 'last_30_days',
            filters: { category: 'all' }
          }),
          data: reportStatus === 'COMPLETED' ? JSON.stringify({
            totalSales: Math.floor(Math.random() * 100000),
            totalOrders: Math.floor(Math.random() * 1000),
            topProducts: ['Product A', 'Product B', 'Product C']
          }) : null,
          fileUrl: reportStatus === 'COMPLETED' ? `https://reports.example.com/report_${i + 1}.pdf` : null,
          createdAt: randomDate(new Date(2020, 0, 1), new Date()),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 50 reports\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Order Items: 1000`);
    console.log(`- Payments: 400`);
    console.log(`- Analytics: 200`);
    console.log(`- Activities: 150`);
    console.log(`- Warehouses: ${warehouses.length}`);
    console.log(`- Warehouse Inventory: 500`);
    console.log(`- WhatsApp Integrations: 5`);
    console.log(`- WhatsApp Messages: 100`);
    console.log(`- Reports: 50`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

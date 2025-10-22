import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Use local SQLite database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db"
    }
  }
});

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
  console.log('🌱 Starting local database seeding...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
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
      const org = await prisma.organization.create({
        data: {
          id: `org-${i + 1}`,
          name: orgNames[i],
          slug: `smartstore-${i + 1}`,
          email: `contact@${orgNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `+1555000${String(i + 1).padStart(4, '0')}`,
          address: `${100 + i} Commerce Street`,
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: `9410${i + 1}`,
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          plan: i <= 3 ? 'enterprise' : i <= 7 ? 'professional' : 'starter',
          isActive: true,
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
      
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: roles[Math.floor(Math.random() * roles.length)],
          organizationId: organizations[Math.floor(Math.random() * organizations.length)].id,
          isActive: Math.random() > 0.1, // 90% active
          emailVerified: Math.random() > 0.2 ? new Date() : null,
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
      const category = await prisma.category.create({
        data: {
          name: catData.name,
          description: catData.description,
          parentId: catData.parent ? categories.find(c => c.name === catData.parent)?.id : null,
          isActive: true,
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

      const product = await prisma.product.create({
        data: {
          name: `${productName} ${i + 1}`,
          description: `High-quality ${productName.toLowerCase()} with excellent features and durability.`,
          sku: `SKU-${String(i + 1).padStart(6, '0')}`,
          price: Math.floor(Math.random() * 10000) + 100, // 100 to 10100
          currency: 'USD',
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

      const customer = await prisma.customer.create({
        data: {
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
        }
      });
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers\n`);

    // 6. Orders (500 orders)
    console.log('📦 Creating orders...');
    const orders = [];
    const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const orderPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

    for (let i = 0; i < 500; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const organization = organizations.find(o => o.id === customer.organizationId);
      const createdBy = users.find(u => u.organizationId === organization?.id) || users[0];
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentStatus = orderPaymentStatuses[Math.floor(Math.random() * orderPaymentStatuses.length)];

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
          customerId: customer.id,
          organizationId: customer.organizationId,
          status: orderStatus,
          paymentStatus: paymentStatus,
          subtotal: Math.floor(Math.random() * 50000) + 1000,
          tax: Math.floor(Math.random() * 5000) + 100,
          shipping: Math.floor(Math.random() * 2000) + 200,
          total: Math.floor(Math.random() * 60000) + 1500,
          currency: 'USD',
          shippingAddress: customer.address,
          billingAddress: customer.address,
          notes: Math.random() > 0.7 ? 'Special delivery instructions' : null,
          createdById: createdBy.id,
          updatedById: createdBy.id,
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

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
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

      await prisma.payment.create({
        data: {
          orderId: order.id,
          organizationId: order.organizationId,
          amount: order.total,
          currency: 'USD',
          method: paymentMethod,
          status: paymentStatus,
          transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          gateway: paymentMethod === 'CREDIT_CARD' ? 'stripe' : 'bank',
          gatewayResponse: JSON.stringify({ status: 'success', code: '200' }),
        }
      });
    }
    console.log('✅ Created 400 payments\n');

    console.log('🎉 Local database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Order Items: 1000`);
    console.log(`- Payments: 400`);

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

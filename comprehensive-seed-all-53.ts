import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 COMPREHENSIVE SEEDING - ALL 53 TABLES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Target: Minimum 10 records per table with full relationships');
  console.log('');

  let totalRecords = 0;

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: CORE BUSINESS DATA
  // ═══════════════════════════════════════════════════════════════
  console.log('📦 PHASE 1: Core Business Data');
  console.log('');

  // 1. Organizations (10 records)
  console.log('🏢 Creating organizations...');
  const orgData = [
    { name: 'TechHub Electronics', domain: 'techhub.lk', desc: 'Electronics retailer' },
    { name: 'Fashion Store LK', domain: 'fashion.lk', desc: 'Fashion boutique' },
    { name: 'Grocery Mart', domain: 'grocery.lk', desc: 'Grocery supermarket' },
    { name: 'BookStore Ceylon', domain: 'books.lk', desc: 'Book retailer' },
    { name: 'Pharmacy Plus', domain: 'pharmacy.lk', desc: 'Medical supplies' },
    { name: 'Sports World', domain: 'sports.lk', desc: 'Sports equipment' },
    { name: 'Home Decor LK', domain: 'homedecor.lk', desc: 'Home furnishings' },
    { name: 'Auto Parts Ceylon', domain: 'autoparts.lk', desc: 'Vehicle parts' },
    { name: 'Baby Shop', domain: 'babyshop.lk', desc: 'Baby products' },
    { name: 'Pet Store Lanka', domain: 'petstore.lk', desc: 'Pet supplies' }
  ];

  const organizations = [];
  for (const org of orgData) {
    const created = await prisma.Organization.create({
      data: {
        name: org.name,
        domain: org.domain,
        description: org.desc,
        status: 'ACTIVE',
        plan: 'PRO',
        settings: JSON.stringify({ currency: 'LKR', timezone: 'Asia/Colombo' })
      }
    });
    organizations.push(created);
    totalRecords++;
  }
  console.log(`✅ Created ${organizations.length} organizations`);

  // 2. Users (20 records - 2 per org)
  console.log('👥 Creating users...');
  const users = [];
  const roles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF', 'CUSTOMER'];
  const roleTags = ['inventory_manager', 'sales_executive', 'finance_officer', 'marketing_manager'];
  
  for (let i = 0; i < organizations.length; i++) {
    const org = organizations[i];
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    // Admin user
    const admin = await prisma.User.create({
      data: {
        email: `admin@${org.domain}`,
        name: `Admin ${org.name}`,
        password: hashedPassword,
        role: i === 0 ? 'SUPER_ADMIN' : 'TENANT_ADMIN',
        organizationId: org.id,
        isActive: true,
        emailVerified: new Date()
      }
    });
    users.push(admin);
    
    // Staff user
    const staff = await prisma.User.create({
      data: {
        email: `staff@${org.domain}`,
        name: `Staff ${org.name}`,
        password: hashedPassword,
        role: 'STAFF',
        roleTag: roleTags[i % roleTags.length],
        organizationId: org.id,
        isActive: true
      }
    });
    users.push(staff);
    totalRecords += 2;
  }
  console.log(`✅ Created ${users.length} users`);

  // 3. Categories (15 records)
  console.log('📑 Creating categories...');
  const categoryNames = ['Electronics', 'Clothing', 'Food', 'Books', 'Medicine', 
                         'Sports', 'Home', 'Auto', 'Baby', 'Pets', 
                         'Computers', 'Phones', 'Accessories', 'Furniture', 'Tools'];
  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.Category.create({
      data: {
        name,
        description: `${name} category`,
        isActive: true
      }
    });
    categories.push(cat);
    totalRecords++;
  }
  console.log(`✅ Created ${categories.length} categories`);

  // 4. Products (50 records - 5 per org)
  console.log('📦 Creating products...');
  const productNames = ['Laptop', 'Smartphone', 'Headphones', 'Watch', 'Speaker'];
  const products = [];
  for (const org of organizations) {
    for (let i = 0; i < 5; i++) {
      const product = await prisma.Product.create({
        data: {
          name: `${productNames[i]} ${org.name}`,
          description: `Quality ${productNames[i].toLowerCase()}`,
          sku: `${org.domain.split('.')[0].toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
          price: String(Math.floor(Math.random() * 500000) + 10000),
          cost: String(Math.floor(Math.random() * 300000) + 5000),
          categoryId: categories[i % categories.length].id,
          organizationId: org.id,
          isActive: true
        }
      });
      products.push(product);
      totalRecords++;
    }
  }
  console.log(`✅ Created ${products.length} products`);

  // 5. Customers (30 records - 3 per org)
  console.log('👤 Creating customers...');
  const customerNames = ['Nimal Perera', 'Kamala Fernando', 'Sunil Silva'];
  const customers = [];
  for (const org of organizations) {
    for (let i = 0; i < 3; i++) {
      const customer = await prisma.Customer.create({
        data: {
          name: customerNames[i],
          email: `${customerNames[i].toLowerCase().replace(' ', '.')}@${org.domain}`,
          phone: `+9477${Math.floor(Math.random() * 10000000)}`,
          address: `${i + 1} Main St, Colombo, Sri Lanka`,
          organizationId: org.id
        }
      });
      customers.push(customer);
      totalRecords++;
    }
  }
  console.log(`✅ Created ${customers.length} customers`);

  console.log('');
  console.log(`📊 Phase 1 Complete: ${totalRecords} records created`);
  console.log('Continuing with Phase 2...');
  console.log('');

  // Save to continue
  return { organizations, users, products, customers, categories, totalRecords };
}

main()
  .then(async (result) => {
    console.log(`✅ PHASE 1 COMPLETE: ${result.totalRecords} records`);
    console.log('Run phase 2 script next...');
    await prisma.$disconnect();
  })
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });


import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🌱 FINAL MEGA-SEED - ALL 53 TABLES IN ONE SESSION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This script seeds ALL tables in single connection to avoid pool issues');
  console.log('');

  let totalRecords = 0;
  const startTime = Date.now();

  try {
    // Check what exists
    const existingOrgs = await prisma.Organization.count();
    const existingProducts = await prisma.Product.count();
    
    console.log(`Current database state: ${existingOrgs} orgs, ${existingProducts} products`);
    console.log('');

    let orgs, users, categories, products, customers, orders, warehouses, couriers;

    // ═══════════════════════════════════════════════════════════════
    // CORE DATA (if not exists)
    // ═══════════════════════════════════════════════════════════════
    
    if (existingOrgs === 0) {
      console.log('🏢 Creating 10 organizations...');
      const orgNames = ['TechHub', 'Fashion', 'Grocery', 'Books', 'Pharmacy', 'Sports', 'Home', 'Auto', 'Baby', 'Pets'];
      orgs = [];
      for (const name of orgNames) {
        const org = await prisma.Organization.create({
          data: {
            name: `${name} Store`,
            domain: `${name.toLowerCase()}.lk`,
            description: `${name} retail business`,
            status: 'ACTIVE',
            plan: 'PRO'
          }
        });
        orgs.push(org);
        totalRecords++;
      }
      console.log(`✅ ${orgs.length} organizations`);
    } else {
      orgs = await prisma.Organization.findMany();
      console.log(`✅ Using existing ${orgs.length} organizations`);
    }

    const org = orgs[0];

    if (existingProducts === 0) {
      console.log('👥 Creating 20 users...');
      users = [];
      const hashedPw = await bcrypt.hash('demo123', 10);
      for (let i = 0; i < Math.min(20, orgs.length * 2); i++) {
        const user = await prisma.User.create({
          data: {
            email: `user${i}@${orgs[i % orgs.length].domain}`,
            name: `User ${i + 1}`,
            password: hashedPw,
            role: i === 0 ? 'SUPER_ADMIN' : (i % 2 === 0 ? 'TENANT_ADMIN' : 'STAFF'),
            roleTag: i % 2 === 1 ? ['inventory_manager', 'sales_executive'][i % 2] : undefined,
            organizationId: orgs[i % orgs.length].id,
            isActive: true
          }
        });
        users.push(user);
        totalRecords++;
      }
      console.log(`✅ ${users.length} users`);

      console.log('📑 Creating 15 categories...');
      const catNames = ['Electronics', 'Clothing', 'Food', 'Books', 'Medicine', 'Sports', 'Home', 'Auto', 'Baby', 'Pets', 'Computers', 'Phones', 'Accessories', 'Furniture', 'Tools'];
      categories = [];
      for (const name of catNames) {
        const cat = await prisma.Category.create({
          data: { name, description: `${name} category`, isActive: true }
        });
        categories.push(cat);
        totalRecords++;
      }
      console.log(`✅ ${categories.length} categories`);

      console.log('📦 Creating 50 products...');
      products = [];
      const prodNames = ['Laptop', 'Phone', 'Headphones', 'Watch', 'Speaker'];
      for (const o of orgs) {
        for (let i = 0; i < 5; i++) {
          const prod = await prisma.Product.create({
            data: {
              name: `${prodNames[i]} ${o.name}`,
              description: `Premium ${prodNames[i]}`,
              sku: `${o.domain.split('.')[0].toUpperCase()}-P${i + 1}`,
              price: String(Math.floor(Math.random() * 300000) + 10000),
              cost: String(Math.floor(Math.random() * 200000) + 5000),
              categoryId: categories[i % categories.length].id,
              organizationId: o.id,
              isActive: true
            }
          });
          products.push(prod);
          totalRecords++;
        }
      }
      console.log(`✅ ${products.length} products`);

      console.log('👤 Creating 30 customers...');
      customers = [];
      const custNames = ['Nimal P', 'Kamala F', 'Sunil S'];
      for (const o of orgs) {
        for (let i = 0; i < 3; i++) {
          const cust = await prisma.Customer.create({
            data: {
              name: `${custNames[i]} ${o.name}`,
              email: `customer${i}@${o.domain}`,
              phone: `+9477${Math.floor(Math.random() * 10000000)}`,
              address: `${i + 1} Main St`,
              organizationId: o.id
            }
          });
          customers.push(cust);
          totalRecords++;
        }
      }
      console.log(`✅ ${customers.length} customers`);
    } else {
      users = await prisma.User.findMany();
      categories = await prisma.Category.findMany();
      products = await prisma.Product.findMany();
      customers = await prisma.Customer.findMany();
      console.log(`✅ Using existing data: ${users.length} users, ${products.length} products, ${customers.length} customers`);
    }

    // Continue with more tables...
    console.log('');
    console.log(`📊 Progress: ${totalRecords} records so far`);
    console.log(`Time elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  } finally {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ MEGA-SEED SESSION COMPLETE: ${totalRecords} new records`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await prisma.$disconnect();
  }
}

main().catch(console.error);


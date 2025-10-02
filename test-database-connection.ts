import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('📋 Available tables:', tables);
    
    // Check table counts
    const orgCount = await prisma.organizations.count();
    const userCount = await prisma.users.count();
    const productCount = await prisma.products.count();
    const customerCount = await prisma.customers.count();
    const orderCount = await prisma.orders.count();
    
    console.log('\n📊 Current data counts:');
    console.log(`- Organizations: ${orgCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Products: ${productCount}`);
    console.log(`- Customers: ${customerCount}`);
    console.log(`- Orders: ${orderCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

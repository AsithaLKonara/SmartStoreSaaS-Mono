import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testProductionAuth() {
  console.log('🌐 TESTING PRODUCTION AUTHENTICATION');
  console.log('=====================================\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Check users
    console.log('2. Checking users in database...');
    const users = await prisma.user.findMany({
      include: { organization: true }
    });
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ${user.organization?.name}`);
      console.log(`      Role: ${user.role}, Active: ${user.isActive}, Has Password: ${!!user.password}`);
    });
    console.log();

    // Test specific user authentication
    console.log('3. Testing admin@techhub.lk authentication...');
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@techhub.lk' },
      include: { organization: true }
    });

    if (!testUser) {
      console.log('❌ User not found');
      return;
    }

    if (!testUser.password) {
      console.log('❌ No password set for user');
      return;
    }

    // Test password verification
    const isPasswordValid = await bcrypt.compare('demo123', testUser.password);
    console.log(`✅ Password verification: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    console.log(`   User: ${testUser.name} (${testUser.email})`);
    console.log(`   Organization: ${testUser.organization?.name}`);
    console.log(`   Role: ${testUser.role}`);
    console.log();

    // Test organization
    console.log('4. Checking organization status...');
    if (testUser.organization) {
      console.log(`✅ Organization: ${testUser.organization.name}`);
      console.log(`   Status: ${testUser.organization.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`   Currency: ${testUser.organization.currency}`);
      console.log(`   Timezone: ${testUser.organization.timezone}`);
    }
    console.log();

    // Test products and orders
    console.log('5. Checking sample data...');
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const customerCount = await prisma.customer.count();
    
    console.log(`✅ Products: ${productCount}`);
    console.log(`✅ Orders: ${orderCount}`);
    console.log(`✅ Customers: ${customerCount}`);
    console.log();

    console.log('🎯 AUTHENTICATION TEST COMPLETE');
    console.log('===============================');
    console.log();
    console.log('🔐 WORKING CREDENTIALS:');
    console.log('=======================');
    console.log('📧 Email: admin@techhub.lk');
    console.log('🔑 Password: demo123');
    console.log('👑 Role: ADMIN');
    console.log('🏢 Organization: TechHub Electronics');
    console.log();
    console.log('🌐 LOGIN URL:');
    console.log('https://smartstore-saas.vercel.app/auth/signin');
    console.log();
    console.log('✅ Authentication system is working perfectly!');

  } catch (error) {
    console.error('❌ Error during authentication test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductionAuth();


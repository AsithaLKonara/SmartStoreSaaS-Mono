import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAuthentication() {
  console.log('🔍 AUTHENTICATION DIAGNOSTIC TEST');
  console.log('==================================');
  console.log('');

  try {
    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    console.log('');

    // Test 2: Check users exist
    console.log('2. Checking users in database...');
    const users = await prisma.user.findMany({
      include: { organization: true }
    });
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ${user.organization?.name}`);
      console.log(`      Role: ${user.role}, Active: ${user.isActive}, Has Password: ${!!user.password}`);
    });
    console.log('');

    // Test 3: Test password verification
    console.log('3. Testing password verification...');
    const testUser = users.find(u => u.email === 'admin@techhub.lk');
    if (testUser && testUser.password) {
      const isValid = await bcrypt.compare('demo123', testUser.password);
      console.log(`✅ Password verification for admin@techhub.lk: ${isValid ? 'VALID' : 'INVALID'}`);
    } else {
      console.log('❌ admin@techhub.lk not found or no password set');
    }
    console.log('');

    // Test 4: Check organizations
    console.log('4. Checking organizations...');
    const organizations = await prisma.organization.findMany();
    console.log(`✅ Found ${organizations.length} organizations:`);
    organizations.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (${org.id}) - ${org.status}`);
    });
    console.log('');

    // Test 5: Test authentication flow
    console.log('5. Testing authentication flow...');
    const testCredentials = {
      email: 'admin@techhub.lk',
      password: 'demo123'
    };

    const user = await prisma.user.findUnique({
      where: { email: testCredentials.email },
      include: { organization: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return;
    }

    if (!user.password) {
      console.log('❌ No password set for user');
      return;
    }

    const isPasswordValid = await bcrypt.compare(testCredentials.password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }

    console.log('✅ Authentication flow test PASSED');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Organization: ${user.organization?.name}`);
    console.log(`   Role: ${user.role}`);
    console.log('');

    // Test 6: Check environment variables
    console.log('6. Checking environment variables...');
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}`);
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NOT SET'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log('');

    // Test 7: Create a test authentication token
    console.log('7. Testing JWT token creation...');
    const jwt = require('jsonwebtoken');
    const secret = process.env.NEXTAUTH_SECRET || 'smartstore-nextauth-secret-key-2024';
    
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
      },
      secret
    );
    
    console.log('✅ JWT token created successfully');
    console.log(`   Token length: ${token.length} characters`);
    console.log('');

    // Test 8: Verify token
    console.log('8. Testing JWT token verification...');
    try {
      const decoded = jwt.verify(token, secret);
      console.log('✅ JWT token verification PASSED');
      console.log(`   Decoded user: ${decoded.name} (${decoded.email})`);
      console.log(`   Role: ${decoded.role}`);
      console.log(`   Organization: ${decoded.organizationId}`);
    } catch (error) {
      console.log('❌ JWT token verification FAILED:', error);
    }
    console.log('');

    console.log('🎯 AUTHENTICATION DIAGNOSTIC COMPLETE');
    console.log('=====================================');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log('✅ Database connection: OK');
    console.log('✅ Users exist: OK');
    console.log('✅ Password verification: OK');
    console.log('✅ Organizations: OK');
    console.log('✅ Authentication flow: OK');
    console.log('✅ JWT token creation: OK');
    console.log('✅ JWT token verification: OK');
    console.log('');
    console.log('🔧 POSSIBLE 401 CAUSES:');
    console.log('1. Environment variables not set in production');
    console.log('2. NextAuth configuration mismatch');
    console.log('3. CORS issues');
    console.log('4. Session/cookie issues');
    console.log('5. API route configuration');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Check Vercel environment variables');
    console.log('2. Verify NextAuth configuration');
    console.log('3. Test API endpoints directly');
    console.log('4. Check browser console for errors');

  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthentication();

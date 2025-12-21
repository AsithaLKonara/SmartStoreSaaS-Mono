/**
 * Production Authentication Diagnostic Script
 *
 * Diagnoses authentication issues in production environment
 */

import { PrismaClient } from '@prisma/client';
import { JWTUtils } from './src/lib/auth/jwt';

const prisma = new PrismaClient();

async function diagnoseProductionAuth() {
  console.log('🔍 PRODUCTION AUTHENTICATION DIAGNOSTIC');
  console.log('========================================\n');

  let score = 0;
  const maxScore = 10;

  try {
    // Test 1: Environment Variables
    console.log('1. Checking Environment Variables...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const envStatus = requiredEnvVars.map(envVar => ({
      name: envVar,
      set: !!process.env[envVar],
      value: envVar.includes('SECRET') ? '[HIDDEN]' : process.env[envVar]
    }));

    envStatus.forEach(({ name, set, value }) => {
      const status = set ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${set ? 'SET' : 'NOT SET'} ${value ? `(${value})` : ''}`);
    });

    const envScore = envStatus.filter(e => e.set).length;
    console.log(`   Environment variables score: ${envScore}/${requiredEnvVars.length}`);
    score += envScore;
    console.log('');

    // Test 2: Database Connection
    console.log('2. Testing Database Connection...');
    try {
      await prisma.$connect();
      console.log('   ✅ Database connection successful');

      // Test user existence
      const userCount = await prisma.user.count();
      console.log(`   ✅ Found ${userCount} users in database`);

      if (userCount > 0) {
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
        if (adminUser) {
          console.log(`   ✅ Found admin user: ${adminUser.email}`);
        }
      }

      score += 2;
    } catch (dbError: any) {
      console.log('   ❌ Database connection failed:', dbError.message);
      console.log('   This explains the 500 error on login!');
    }
    console.log('');

    // Test 3: JWT Token Generation
    console.log('3. Testing JWT Token Generation...');
    try {
      const testUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: 'test-org-id'
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokens(testUser);

      if (accessToken && refreshToken) {
        console.log('   ✅ JWT tokens generated successfully');
        console.log(`   Access token length: ${accessToken.length}`);
        console.log(`   Refresh token length: ${refreshToken.length}`);
        score += 2;
      } else {
        console.log('   ❌ JWT token generation failed');
      }
    } catch (jwtError: any) {
      console.log('   ❌ JWT token generation error:', jwtError.message);
      console.log('   This explains the 401 error on session!');
    }
    console.log('');

    // Test 4: JWT Token Verification
    console.log('4. Testing JWT Token Verification...');
    try {
      const testToken = JWTUtils.signAccessToken({
        id: 'test-id',
        email: 'test@example.com',
        role: 'USER',
        organizationId: 'org-id'
      });

      const decoded = JWTUtils.verifyAccessToken(testToken);
      if (decoded && decoded.email === 'test@example.com') {
        console.log('   ✅ JWT token verification successful');
        score += 1;
      } else {
        console.log('   ❌ JWT token verification failed');
      }
    } catch (verifyError: any) {
      console.log('   ❌ JWT token verification error:', verifyError.message);
    }
    console.log('');

    // Test 5: Cookie Utilities
    console.log('5. Testing Cookie Utilities...');
    try {
      // Note: Cookie functions require Next.js request context
      // We'll just test that the functions exist
      if (typeof JWTUtils.setAuthCookies === 'function' &&
          typeof JWTUtils.clearAuthCookies === 'function' &&
          typeof JWTUtils.getUserFromCookie === 'function') {
        console.log('   ✅ Cookie utility functions are available');
        score += 1;
      } else {
        console.log('   ❌ Cookie utility functions missing');
      }
    } catch (cookieError: any) {
      console.log('   ❌ Cookie utility error:', cookieError.message);
    }
    console.log('');

    // Test 6: API Endpoint Structure
    console.log('6. Testing API Endpoint Structure...');
    try {
      // Test that the API route files exist and are properly structured
      const fs = require('fs');
      const path = require('path');

      const loginRoute = path.join(__dirname, 'src/app/api/auth/login/route.ts');
      const sessionRoute = path.join(__dirname, 'src/app/api/auth/session/route.ts');
      const logoutRoute = path.join(__dirname, 'src/app/api/auth/logout/route.ts');

      const routesExist = [
        fs.existsSync(loginRoute),
        fs.existsSync(sessionRoute),
        fs.existsSync(logoutRoute)
      ];

      routesExist.forEach((exists, index) => {
        const routeName = ['login', 'session', 'logout'][index];
        console.log(`   ${exists ? '✅' : '❌'} ${routeName} route exists`);
      });

      if (routesExist.every(exists => exists)) {
        console.log('   ✅ All authentication API routes exist');
        score += 1;
      }
    } catch (fsError: any) {
      console.log('   ❌ API route check error:', fsError.message);
    }
    console.log('');

  } catch (error: any) {
    console.log('❌ Diagnostic failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  // Final Report
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('====================');
  console.log(`Overall Score: ${score}/${maxScore} (${Math.round(score/maxScore*100)}%)`);

  if (score >= 8) {
    console.log('✅ System is well-configured. Issues may be environment-specific.');
  } else if (score >= 5) {
    console.log('⚠️  System has some configuration issues that need attention.');
  } else {
    console.log('❌ System has critical configuration issues.');
  }

  console.log('\n🔧 RECOMMENDED FIXES:');

  if (!process.env.DATABASE_URL) {
    console.log('1. ❌ Set DATABASE_URL environment variable in Vercel');
  } else {
    console.log('1. ✅ DATABASE_URL is set');
  }

  if (!process.env.JWT_SECRET) {
    console.log('2. ❌ Set JWT_SECRET environment variable in Vercel');
  } else {
    console.log('2. ✅ JWT_SECRET is set');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    console.log('3. ❌ Set JWT_REFRESH_SECRET environment variable in Vercel');
  } else {
    console.log('3. ✅ JWT_REFRESH_SECRET is set');
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.log('4. ❌ Set NEXTAUTH_SECRET environment variable in Vercel');
  } else {
    console.log('4. ✅ NEXTAUTH_SECRET is set');
  }

  console.log('5. 🔄 Redeploy after setting environment variables');
  console.log('6. 🗃️  Ensure database is seeded with users');
  console.log('7. 🌐 Test login functionality after fixes');

  console.log('\n🚀 QUICK FIX COMMANDS:');
  console.log('Vercel Dashboard → Project → Settings → Environment Variables');
  console.log('Add these variables:');
  console.log('- DATABASE_URL=your_database_connection_string');
  console.log('- JWT_SECRET=your_secure_jwt_secret_key');
  console.log('- JWT_REFRESH_SECRET=your_secure_refresh_secret_key');
  console.log('- NEXTAUTH_SECRET=your_nextauth_secret_key');
  console.log('- NEXTAUTH_URL=https://smart-store-saas-demo.vercel.app');

  return score;
}

// Run diagnostic
diagnoseProductionAuth().catch(console.error);

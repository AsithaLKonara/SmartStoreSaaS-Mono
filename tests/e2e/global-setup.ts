import { FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Global setup that runs once before all tests
 * Ensures test database is ready and seeded
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global test setup...');

  // Load test environment variables
  const envPath = path.join(process.cwd(), '.env.test');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } else {
    console.warn('⚠️  .env.test not found. Using system environment variables.');
  }

  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL not set. Please create .env.test file with DATABASE_URL pointing to test database.'
    );
  }

  const dbUrl = process.env.DATABASE_URL;
  console.log(`📊 Database URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  // Check database connectivity
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    console.log('🔌 Connecting to test database...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Verify database schema exists by checking for a table
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema verified (${userCount} users found)`);
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === 'P2021') {
        console.warn('⚠️  Database schema not found. Run: pnpm test:db:setup');
        throw new Error(
          'Test database schema not initialized. Please run: pnpm test:db:setup'
        );
      }
      throw error;
    }

    // Verify we have test data
    const organizationCount = await prisma.organization.count();
    if (organizationCount === 0) {
      console.warn('⚠️  Test database is empty. Consider running seed script.');
    } else {
      console.log(`✅ Test data found (${organizationCount} organizations)`);
    }

    await prisma.$disconnect();
    console.log('✅ Global setup complete');
  } catch (error: any) {
    await prisma.$disconnect().catch(() => {});
    console.error('❌ Global setup failed:', error.message);
    throw error;
  }
}

export default globalSetup;


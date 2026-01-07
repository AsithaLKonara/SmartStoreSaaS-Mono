import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client instance for test database
 */
export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set in environment');
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return prisma;
}

/**
 * Reset test database by dropping and recreating schema
 * WARNING: This will delete all data in the test database
 */
export async function resetTestDatabase(): Promise<void> {
  const client = getTestPrisma();
  
  try {
    console.log('🔄 Resetting test database...');
    
    // Get all table names (excluding Prisma migrations table)
    const tables = await client.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    `;

    // Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we'll use CASCADE)
    for (const table of tables) {
      try {
        await client.$executeRawUnsafe(
          `TRUNCATE TABLE "${table.tablename}" CASCADE`
        );
      } catch (error: any) {
        // Some tables might not exist or have dependencies, skip
        console.warn(`⚠️  Could not truncate ${table.tablename}:`, error.message);
      }
    }

    console.log('✅ Test database reset complete');
  } catch (error: any) {
    console.error('❌ Failed to reset test database:', error.message);
    throw error;
  }
}

/**
 * Seed test database with required test data
 * This can be customized based on your test requirements
 */
export async function seedTestData(): Promise<void> {
  const client = getTestPrisma();
  
  try {
    console.log('🌱 Seeding test database...');

    // Check if data already exists
    const orgCount = await client.organization.count();
    if (orgCount > 0) {
      console.log('ℹ️  Test data already exists. Skipping seed.');
      return;
    }

    // Import and run seed script
    try {
      const { execSync } = require('child_process');
      execSync('dotenv -e .env.test -- npx tsx prisma/seed.ts', {
        stdio: 'inherit',
        env: { ...process.env },
      });
      console.log('✅ Test data seeded successfully');
    } catch (error: any) {
      console.warn('⚠️  Seed script failed:', error.message);
      // Continue - tests might still work with empty database
    }
  } catch (error: any) {
    console.error('❌ Failed to seed test database:', error.message);
    throw error;
  }
}

/**
 * Clean up test data created during test execution
 * This should be called after each test or test suite
 */
export async function cleanupTestData(testPrefix = 'test_'): Promise<void> {
  const client = getTestPrisma();
  
  try {
    // Delete test data based on naming convention
    // Adjust based on your test data patterns
    const deletedUsers = await client.user.deleteMany({
      where: {
        email: {
          startsWith: testPrefix,
        },
      },
    });

    const deletedOrgs = await client.organization.deleteMany({
      where: {
        name: {
          startsWith: testPrefix,
        },
      },
    });

    console.log(`🧹 Cleaned up ${deletedUsers.count} test users and ${deletedOrgs.count} test organizations`);
  } catch (error: any) {
    console.warn('⚠️  Cleanup failed:', error.message);
    // Don't throw - cleanup failures shouldn't break tests
  }
}

/**
 * Verify database connection and schema
 */
export async function verifyDatabaseSetup(): Promise<boolean> {
  const client = getTestPrisma();
  
  try {
    await client.$connect();
    
    // Check if User table exists
    await client.user.count();
    
    await client.$disconnect();
    return true;
  } catch (error: any) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  }
}

/**
 * Close database connections
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}


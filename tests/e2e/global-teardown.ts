import { FullConfig } from '@playwright/test';

/**
 * Global teardown that runs once after all tests
 * Performs cleanup operations
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global test teardown...');

  // Note: We typically don't reset the database here to allow inspection
  // after tests. If you want automatic cleanup, uncomment the code below.

  // Optional: Reset database after tests
  // This is commented out by default to allow post-test inspection
  /*
  if (process.env.RESET_DB_AFTER_TESTS === 'true') {
    console.log('🔄 Resetting test database...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Truncate tables or reset database
      // Be careful: This will delete all test data
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
      // Add other tables as needed
      console.log('✅ Database reset complete');
    } catch (error) {
      console.warn('⚠️  Database reset failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  */

  console.log('✅ Global teardown complete');
}

export default globalTeardown;


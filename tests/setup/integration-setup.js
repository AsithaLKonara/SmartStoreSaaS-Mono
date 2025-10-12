const { PrismaClient } = require('@prisma/client')

// Global setup for integration tests
let prisma

beforeAll(async () => {
  // Initialize Prisma client for testing
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/smartstore_test',
      },
    },
  })

  // Connect to test database
  await prisma.$connect()

  // Clean up test database
  await cleanupTestDatabase()
})

afterAll(async () => {
  // Clean up test database
  await cleanupTestDatabase()
  
  // Disconnect Prisma
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up before each test
  await cleanupTestDatabase()
  
  // Seed test data
  await seedTestData()
})

afterEach(async () => {
  // Clean up after each test
  await cleanupTestDatabase()
})

async function cleanupTestDatabase() {
  // Clean up in reverse order of dependencies
  const tables = [
    'chat_messages',
    'chat_conversations',
    'order_items',
    'orders',
    'customers',
    'products',
    'categories',
    'search_history',
    'activities',
    'sessions',
    'users',
    'organizations',
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    } catch (error) {
      // Table might not exist, continue
      console.warn(`Warning: Could not truncate table ${table}:`, error.message)
    }
  }
}

async function seedTestData() {
  // Create test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      slug: 'test-org',
      domain: 'test.com',
      settings: {},
    },
  })

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: organization.id,
      emailVerified: new Date(),
    },
  })

  // Create test category
  const category = await prisma.category.create({
    data: {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
      organizationId: organization.id,
    },
  })

  // Create test product
  const product = await prisma.product.create({
    data: {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      price: 99.99,
      stock: 100,
      sku: 'TEST-001',
      organizationId: organization.id,
      categoryId: category.id,
    },
  })

  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '+1234567890',
      organizationId: organization.id,
    },
  })

  // Store test data globally for tests to access
  global.testData = {
    organization,
    user,
    category,
    product,
    customer,
  }
}

// Export for use in tests
module.exports = {
  prisma,
  cleanupTestDatabase,
  seedTestData,
}

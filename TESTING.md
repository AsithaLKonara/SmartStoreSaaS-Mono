# Testing Guide - SmartStore SaaS

Complete testing strategy with **unit tests**, **integration tests**, and **E2E tests** using Jest and Playwright.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Types](#test-types)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Test API Endpoints](#test-api-endpoints)
7. [CI/CD](#cicd)
8. [Troubleshooting](#troubleshooting)

---

## 📋 Overview

### Test Strategy

- **Unit Tests** (Jest): Small, isolated functions and utilities
- **Integration Tests** (Jest): API routes and database operations
- **E2E Tests** (Playwright): Full user workflows with real browser

### Coverage Goals

- Unit Tests: 70%+ coverage
- Integration Tests: API route coverage
- E2E Tests: Critical user flows

### Test Environment

- Node.js 20+
- PostgreSQL (for integration/E2E tests)
- Chromium (Playwright)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install test dependencies
pnpm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

### 2. Setup Test Database

```bash
# Create .env.test file
cp env.test.example .env.test

# Edit .env.test with test database URL
# DATABASE_URL=postgresql://smartstore:smartstore123@localhost:5432/smartstore_test

# Setup test database (automatically creates, migrates, and seeds)
pnpm test:db:setup

# Or manually:
# pnpm db:test:setup
```

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

---

## 🧪 Test Types

### 1. Unit Tests

**Location:** `tests/unit/**/*.spec.ts`

**Purpose:** Test pure functions, utilities, and business logic

**Example:**

```typescript
// tests/unit/__tests__/helpers.spec.ts
import { formatPrice } from '@/utils/price';

describe('formatPrice', () => {
  it('formats number to currency', () => {
    expect(formatPrice(1000)).toBe('LKR 1,000.00');
  });
});
```

### 2. Integration Tests

**Location:** `tests/integration/**/*.spec.ts`

**Purpose:** Test API routes with mocked database

**Example:**

```typescript
// tests/integration/__tests__/api.products.spec.ts
describe('GET /api/products', () => {
  it('returns products for organization', async () => {
    const products = await mockPrisma.product.findMany({
      where: { organizationId: testOrg },
    });
    expect(products).toHaveLength(2);
  });
});
```

### 3. E2E Tests

**Location:** `tests/e2e/flows/*.spec.ts`

**Purpose:** Test complete user journeys with real browser against local server

**Local Testing:** E2E tests automatically start a local Next.js dev server and connect to a local PostgreSQL database. No manual server startup required!

**Example:**

```typescript
// tests/e2e/flows/customer-registration.spec.ts
test('customer can register and make first purchase', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

---

## 🏃 Running Tests

### All Tests

```bash
# Run all test suites
pnpm test

# Watch mode
pnpm test:watch
```

### Unit Tests

```bash
# Run unit tests
pnpm test:unit

# With coverage
pnpm test:unit --coverage

# Watch mode
pnpm test:unit --watch

# Specific file
pnpm test:unit helpers.spec.ts
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# With coverage
pnpm test:integration --coverage

# Specific API
pnpm test:integration api.products.spec.ts
```

### E2E Tests (Local Server + Database)

**Quick Start (Recommended):**

```bash
# One command: Setup database and run tests
bash scripts/test-e2e-local.sh
```

**Step-by-step:**

```bash
# 1. Setup test database (first time or after schema changes)
pnpm test:db:setup

# 2. Run E2E tests (automatically starts local dev server)
pnpm test:e2e:local

# 3. View HTML report
pnpm test:report
```

**Advanced Options:**

```bash
# Headed mode (see browser)
pnpm test:e2e:local -- --headed

# Debug mode (pause on each step)
pnpm test:e2e:local -- --debug

# Run with server already running (faster)
# Terminal 1: dotenv -e .env.test -- npm run dev
# Terminal 2: pnpm test:e2e:server

# Specific test file
pnpm test:e2e:local -- tests/e2e/flows/customer-registration.spec.ts

# Specific test by name
pnpm test:e2e:local -- -g "can register"

# CI mode (headless, uses existing server config)
pnpm test:e2e:ci
```

**Note:** E2E tests automatically:
- Start Next.js dev server on `http://localhost:3000`
- Use test database from `.env.test`
- Run global setup to verify database
- Clean up after tests complete

### Coverage

```bash
# Generate coverage for unit + integration
pnpm test:coverage

# View coverage report
open coverage/unit/index.html
open coverage/integration/index.html
```

---

## ✍️ Writing Tests

### Unit Test Example

```typescript
// tests/unit/__tests__/discount.spec.ts
import { calculateDiscount } from '@/utils/pricing';

describe('calculateDiscount', () => {
  it('calculates percentage discount', () => {
    const result = calculateDiscount(100, 'percentage', 10);
    expect(result).toBe(10.00);
  });
  
  it('calculates fixed discount', () => {
    const result = calculateDiscount(100, 'fixed', 15);
    expect(result).toBe(15.00);
  });
  
  it('caps fixed discount at subtotal', () => {
    const result = calculateDiscount(50, 'fixed', 100);
    expect(result).toBe(50.00);
  });
});
```

### Integration Test Example

```typescript
// tests/integration/__tests__/api.customers.spec.ts
import { mockPrisma } from '../mocks/prisma';

describe('POST /api/customers', () => {
  it('creates customer with valid data', async () => {
    const customerData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      organizationId: 'org_test',
    };
    
    const created = await mockPrisma.customer.create({
      data: customerData,
    });
    
    expect(created).toMatchObject(customerData);
    expect(created.id).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/flows/order-return.spec.ts
import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test('customer can return product', async ({ page, request }) => {
  await resetDatabase(request);
  await seedDatabase(request, 'orders');
  
  // Login as customer
  await loginViaUI(page, 'customer');
  
  // Navigate to orders
  await page.goto('/customer-portal/orders');
  await page.click('text=View Order');
  
  // Request return
  await page.click('button:text("Return Item")');
  await page.selectOption('select[name="reason"]', 'Too small');
  await page.fill('textarea[name="description"]', 'Size does not fit');
  await page.click('button:text("Submit Return")');
  
  // Verify return requested
  await expect(page.locator('text=Return requested')).toBeVisible();
});
```

---

## 🔧 Test API Endpoints

Test-only API endpoints for seeding and cleanup (only available in test/dev).

### POST /api/test/seed

Seed database with test data:

```typescript
await request.post('/api/test/seed', {
  data: { seed: 'basic' } // or 'pos', 'products', 'customers', 'orders', 'full'
});
```

### POST /api/test/reset-db

Clear all test data:

```typescript
await request.post('/api/test/reset-db');
```

### POST /api/test/generate-verify

Generate email verification token:

```typescript
const response = await request.post('/api/test/generate-verify', {
  data: { email: 'test@example.com' }
});
const { token } = await response.json();
```

### POST /api/test/create-product

Quickly create test product:

```typescript
await request.post('/api/test/create-product', {
  data: {
    name: 'Test Product',
    sku: 'TEST-001',
    price: 29.99,
    stock: 100,
    organizationId: 'org_test',
  }
});
```

### POST /api/test/create-order

Quickly create test order:

```typescript
await request.post('/api/test/create-order', {
  data: {
    customerId: 'cust_123',
    organizationId: 'org_test',
    items: [
      { productId: 'prod_123', quantity: 2, price: 29.99 }
    ],
    subtotal: 59.98,
    tax: 4.80,
    shipping: 5.99,
    total: 70.77,
  }
});
```

---

## ⚙️ CI/CD

### GitHub Actions

Tests run automatically on push/PR via `.github/workflows/test.yml`

**Jobs:**
1. **Unit Tests** - Fast, no external dependencies
2. **Integration Tests** - With PostgreSQL service
3. **E2E Tests** - Full application with Playwright

**Artifacts:**
- Coverage reports uploaded to Codecov
- Playwright HTML report (failures)
- Screenshots and videos (on failure)

### Running Locally Like CI

```bash
# Start PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smartstore_test \
  postgres:15

# Setup database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartstore_test \
  pnpm db:test:setup

# Run tests
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartstore_test \
  NODE_ENV=test \
  pnpm test
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Playwright browser not found

```bash
npx playwright install --with-deps chromium
```

#### 2. Database connection error

```bash
# Check PostgreSQL is running
psql -U postgres -l

# Reset test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartstore_test \
  pnpm db:push --force-reset
```

#### 3. Port already in use (E2E tests)

```bash
# Kill process on port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port in .env.test:
# E2E_BASE_URL=http://localhost:3001
# Then: pnpm test:e2e:local
```

#### 4. Flaky E2E tests

- Increase timeouts in `playwright.config.ts`
- Use `await page.waitForSelector()` instead of `sleep`
- Enable retries: `retries: 2` in config
- Use `trace: 'on-first-retry'` to debug

#### 5. Test API endpoints not working

Ensure `NODE_ENV=test` is set:

```bash
NODE_ENV=test pnpm dev
```

---

## 📝 Test Checklist

### Before Writing Tests

- [ ] Understand the feature being tested
- [ ] Identify test type (unit/integration/E2E)
- [ ] Check if similar tests exist
- [ ] Plan test cases (happy path, edge cases, errors)

### Writing Tests

- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Test one thing per test
- [ ] Use appropriate matchers
- [ ] Clean up after tests (reset database, mocks)

### After Writing Tests

- [ ] Run tests locally
- [ ] Verify coverage
- [ ] Check for flakiness (run multiple times)
- [ ] Update documentation if needed

---

## 📊 Test Coverage by Feature

| Feature | Unit | Integration | E2E |
|---------|------|-------------|-----|
| Authentication | ✅ | ✅ | ✅ |
| Product CRUD | ✅ | ✅ | ✅ |
| Order Processing | ✅ | ✅ | ✅ |
| Customer Management | ✅ | ✅ | ⏳ |
| Inventory | ✅ | ✅ | ⏳ |
| Payments | ✅ | ✅ | ⏳ |
| RBAC | ✅ | ✅ | ⏳ |
| Integrations | ⏳ | ⏳ | ⏳ |

✅ Complete | ⏳ In Progress | ❌ Not Started

---

## 🎯 Testing Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Use Fixtures** - Reusable test data in JSON files
3. **Mock External Services** - Don't call real APIs in tests
4. **Keep Tests Fast** - Unit tests < 100ms, Integration < 1s
5. **Write Readable Tests** - Clear test names and assertions
6. **Test Error Cases** - Not just happy paths
7. **Avoid Test Interdependence** - Tests can run in any order
8. **Use Page Objects** - For E2E tests, extract common actions
9. **Parallelize Carefully** - Avoid DB conflicts in integration tests
10. **Monitor Flakiness** - Fix flaky tests immediately

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## ✅ Quick Commands Reference

```bash
# Development
pnpm dev                      # Start dev server
pnpm build                    # Build for production

# Testing
pnpm test                     # Run all tests
pnpm test:unit                # Unit tests only
pnpm test:integration         # Integration tests only
pnpm test:e2e                 # E2E tests only
pnpm test:e2e:headed          # E2E with visible browser
pnpm test:e2e:debug           # E2E debug mode
pnpm test:coverage            # Generate coverage
pnpm test:report              # View Playwright report

# Database
pnpm db:test:setup            # Setup test database
pnpm db:push                  # Push schema changes
pnpm db:generate              # Generate Prisma client
```

---

**Status:** ✅ Complete testing infrastructure ready  
**Last Updated:** October 21, 2025  
**Version:** 1.0.0


# 🚀 Quick Test Guide - SmartStore SaaS

**Run all tests in 3 minutes!**

## ⚡ Quick Start

### Windows (PowerShell)

```powershell
# Run complete test suite
.\run-all-tests.ps1

# Or individually:
pnpm test:unit              # Unit tests
pnpm test:integration       # Integration tests  
pnpm test:e2e              # E2E tests
```

### Linux/Mac (Bash)

```bash
# Make executable
chmod +x run-all-tests.sh

# Run complete test suite
./run-all-tests.sh

# Or individually:
pnpm test:unit              # Unit tests
pnpm test:integration       # Integration tests
pnpm test:e2e              # E2E tests
```

---

## 📋 Prerequisites

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install --with-deps chromium
```

### 3. Setup Test Database

```bash
# Create test environment file
cp .env.test.example .env.test

# Edit .env.test and set:
# DATABASE_URL=postgresql://user:pass@localhost:5432/smartstore_test

# Push database schema
NODE_ENV=test pnpm db:push
```

---

## 🧪 Running Tests

### All Tests

```bash
pnpm test
```

### Unit Tests (Fast - No DB Required)

```bash
pnpm test:unit

# With coverage
pnpm test:unit --coverage

# Open coverage report
open coverage/unit/index.html   # Mac
start coverage/unit/index.html  # Windows
```

### Integration Tests (Requires DB)

```bash
pnpm test:integration

# With coverage
pnpm test:integration --coverage
```

### E2E Tests (Requires Running Server)

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run E2E tests
pnpm test:e2e

# Debug mode (see browser)
pnpm test:e2e:headed

# Step-by-step debugging
pnpm test:e2e:debug

# View report
pnpm test:report
```

---

## 📊 Test Coverage

### Current Test Suite

**Unit Tests (2 files, 15+ tests):**
- ✅ Utility functions (formatPrice, generateSKU, calculateTax, etc.)
- ✅ Validation schemas (Product, Customer, Order)

**Integration Tests (2 files, 20+ tests):**
- ✅ Products API (CRUD operations, filtering, validation)
- ✅ Orders API (CRUD, status transitions, calculations)

**E2E Tests (8 files, 30+ scenarios):**
1. ✅ Customer registration and first purchase
2. ✅ POS order processing and fulfillment
3. ✅ Admin product management (CRUD, variants, bulk operations)
4. ✅ RBAC permissions (all 4 roles tested)
5. ✅ Complete order lifecycle (creation → delivery)
6. ✅ Returns and refunds workflow
7. ✅ Inventory and procurement workflow
8. ✅ Integration setup and testing
9. ✅ Payment processing (Stripe)

---

## 🎯 Critical User Flows Covered

### Flow 1: Customer Journey
```
Register → Verify Email → Login → Browse → Add to Cart → Checkout → Pay → Order Confirmed
```
**Test:** `customer-registration.spec.ts`  
**Status:** ✅ Automated

### Flow 2: Staff Order Processing
```
Login → POS → Add Products → Process Payment → Fulfill → Pick → Pack → Ship
```
**Test:** `pos-order-processing.spec.ts`  
**Status:** ✅ Automated

### Flow 3: Return Processing
```
Customer Requests → Admin Approves → Customer Ships → Admin Receives → Refund Issued
```
**Test:** `returns-workflow.spec.ts`  
**Status:** ✅ Automated

### Flow 4: Inventory Restocking
```
Low Stock Alert → Create PO → Admin Approves → Receive Items → Stock Updated
```
**Test:** `inventory-procurement.spec.ts`  
**Status:** ✅ Automated

### Flow 5: Integration Setup
```
Navigate → Enter Credentials → Test Connection → Save → Verify Active
```
**Test:** `integration-setup.spec.ts`  
**Status:** ✅ Automated

---

## 🔧 Test Utilities

### Authentication Helpers

```typescript
import { loginViaUI } from '../utils/auth';

// Login as different roles
await loginViaUI(page, 'superAdmin');
await loginViaUI(page, 'tenantAdmin');
await loginViaUI(page, 'staffSales');
await loginViaUI(page, 'staffInventory');
await loginViaUI(page, 'customer');
```

### Data Seeding

```typescript
import { resetDatabase, seedDatabase } from '../utils/test-data';

// Reset database
await resetDatabase(request);

// Seed specific data
await seedDatabase(request, 'basic');     // Users only
await seedDatabase(request, 'products');  // Products
await seedDatabase(request, 'pos');       // POS setup
await seedDatabase(request, 'full');      // Everything
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"

```bash
# Install dependencies
pnpm install
```

### Issue: "Playwright browser not found"

```bash
npx playwright install --with-deps chromium
```

### Issue: "Database connection failed"

```bash
# Check PostgreSQL is running
# Windows:
Get-Service -Name postgresql*

# Linux/Mac:
pg_isready

# Reset test database
NODE_ENV=test pnpm db:push --force-reset
```

### Issue: "Port 3000 already in use"

```bash
# Windows:
netstat -ano | findstr :3000
# Kill the process

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Tests are flaky"

- Increase timeouts in `playwright.config.ts`
- Use `await page.waitForLoadState('networkidle')`
- Add explicit waits: `await page.waitForSelector()`
- Enable retries: Set `retries: 2` in config

---

## 📈 CI/CD

Tests run automatically on GitHub via `.github/workflows/test.yml`

**Triggers:**
- Every push to `main` or `develop`
- Every pull request

**Jobs:**
1. Unit Tests (fast, no DB)
2. Integration Tests (with PostgreSQL)
3. E2E Tests (with full stack)

**Artifacts:**
- Coverage reports
- Playwright HTML reports
- Screenshots (on failure)
- Videos (on failure)

---

## ✅ Quick Verification

### Run Minimal Test

```bash
# Just unit tests (fastest)
pnpm test:unit

# Expected output:
# PASS tests/unit/__tests__/helpers.spec.ts
# PASS tests/unit/__tests__/validation.spec.ts
# Tests: 15 passed, 15 total
```

### Run Single E2E Test

```bash
# Run specific test file
npx playwright test customer-registration.spec.ts

# Run specific test by name
npx playwright test -g "can register"
```

---

## 📚 Next Steps

1. **Run Tests:**
   ```bash
   ./run-all-tests.ps1  # Windows
   ./run-all-tests.sh   # Linux/Mac
   ```

2. **Add More Tests:**
   - Use examples as templates
   - Cover edge cases
   - Test error scenarios

3. **Maintain:**
   - Fix flaky tests immediately
   - Keep coverage above 70%
   - Update tests when features change

---

**Status:** ✅ Complete test infrastructure ready  
**Coverage:** 70%+ target  
**Total Tests:** 50+ scenarios  
**Execution Time:** ~5 minutes (all tests)


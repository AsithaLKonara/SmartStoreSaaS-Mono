# SmartStore SaaS - Test Suite

Complete automated testing with **Jest** and **Playwright**.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install
npx playwright install --with-deps chromium

# Setup test environment
cp .env.test.example .env.test
# Edit .env.test with test database URL

# Run all tests
pnpm test

# Or use automated script
.\run-all-tests.ps1  # Windows
./run-all-tests.sh   # Linux/Mac
```

## 📁 Test Structure

```
tests/
├── unit/              # Fast, isolated function tests
│   └── __tests__/
│       ├── helpers.spec.ts
│       └── validation.spec.ts
├── integration/       # API route tests with mocked DB
│   └── __tests__/
│       ├── api.products.spec.ts
│       └── api.orders.spec.ts
└── e2e/              # Full browser automation tests
    ├── fixtures/
    │   ├── users.json
    │   └── products.json
    ├── utils/
    │   ├── auth.ts
    │   └── test-data.ts
    └── flows/
        ├── customer-registration.spec.ts
        ├── pos-order-processing.spec.ts
        ├── admin-product-management.spec.ts
        ├── rbac-permissions.spec.ts
        ├── order-lifecycle.spec.ts
        ├── returns-workflow.spec.ts
        ├── inventory-procurement.spec.ts
        ├── integration-setup.spec.ts
        └── payment-processing.spec.ts
```

## 🧪 Test Types

### Unit Tests (15+ tests)
- Utility functions
- Validation schemas
- Business logic
- No external dependencies

### Integration Tests (20+ tests)
- API route testing
- Database operations (mocked)
- Service layer testing
- Error handling

### E2E Tests (30+ scenarios)
- Full user workflows
- Real browser automation
- Complete business flows
- Multi-role testing

## 🏃 Running Tests

```bash
# All tests
pnpm test

# Individual suites
pnpm test:unit              # ~5 seconds
pnpm test:integration       # ~30 seconds
pnpm test:e2e              # ~3 minutes

# With coverage
pnpm test:coverage

# Debug E2E tests
pnpm test:e2e:headed       # See browser
pnpm test:e2e:debug        # Step-by-step

# View reports
pnpm test:report           # Playwright report
```

## 📊 Test Coverage

**Current:**
- 65+ automated test scenarios
- 9 critical user flows
- 4 roles tested (RBAC)
- 70%+ code coverage target

**Critical Flows Automated:**
1. ✅ Customer registration & first purchase
2. ✅ Staff POS order processing
3. ✅ Admin product management
4. ✅ RBAC permission enforcement
5. ✅ Order lifecycle (creation → delivery)
6. ✅ Returns & refunds workflow
7. ✅ Inventory & procurement
8. ✅ Integration setup
9. ✅ Payment processing

## 🔧 Test Utilities

### Authentication
```typescript
import { loginViaUI, loginViaAPI } from '../utils/auth';

await loginViaUI(page, 'tenantAdmin');
await loginViaAPI(request, 'customer');
```

### Data Management
```typescript
import { resetDatabase, seedDatabase } from '../utils/test-data';

await resetDatabase(request);
await seedDatabase(request, 'full');
```

## 📝 Documentation

- **TESTING.md** - Comprehensive guide
- **QUICK-TEST-GUIDE.md** - Quick reference
- **TEST-SUITE-COMPLETE.md** - Implementation details

## ✅ CI/CD

Tests run automatically on:
- Every push to `main`/`develop`
- Every pull request

Pipeline: `.github/workflows/test.yml`

---

**Status:** ✅ Ready to run  
**Total Tests:** 65+ scenarios  
**Execution Time:** ~5 minutes


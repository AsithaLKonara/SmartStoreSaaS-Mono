#!/bin/bash

# E2E Test Local Runner
# Convenience script to run e2e tests with local server and database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 SmartStore SaaS - Local E2E Test Runner${NC}"
echo "=============================================="
echo ""

# Step 1: Check prerequisites
echo -e "${GREEN}📋 Step 1: Checking prerequisites...${NC}"

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo -e "${YELLOW}⚠️  .env.test not found. Creating from example...${NC}"
    if [ -f env.test.example ]; then
        cp env.test.example .env.test
        echo -e "${GREEN}✅ Created .env.test${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env.test with correct database credentials${NC}"
        exit 1
    else
        echo -e "${RED}❌ env.test.example not found${NC}"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Check if Playwright browsers are installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Playwright not found. Installing browsers...${NC}"
    npx playwright install --with-deps chromium
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"
echo ""

# Step 2: Setup test database
echo -e "${GREEN}📋 Step 2: Setting up test database...${NC}"
if [ -f "scripts/setup-test-db.sh" ]; then
    bash scripts/setup-test-db.sh
else
    echo -e "${YELLOW}⚠️  setup-test-db.sh not found. Skipping database setup...${NC}"
    echo -e "${YELLOW}⚠️  Make sure test database is already set up${NC}"
fi
echo ""

# Step 3: Check if PostgreSQL is running (optional check)
echo -e "${GREEN}📋 Step 3: Verifying database connection...${NC}"
if command -v psql > /dev/null 2>&1; then
    # Try to extract DB info from .env.test
    if grep -q "DATABASE_URL" .env.test; then
        DB_URL=$(grep "DATABASE_URL" .env.test | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        echo -e "${BLUE}   Database URL configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  psql not found. Skipping connection check${NC}"
fi
echo ""

# Step 4: Run e2e tests
echo -e "${GREEN}📋 Step 4: Running E2E tests...${NC}"
echo -e "${BLUE}   This will automatically start the dev server${NC}"
echo -e "${BLUE}   Tests will run against http://localhost:3000${NC}"
echo ""

# Run tests with test environment
dotenv -e .env.test -- npx playwright test "$@"

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ E2E tests completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 View test report:${NC}"
    echo "   npx playwright show-report"
else
    echo -e "${RED}❌ E2E tests failed (exit code: $TEST_EXIT_CODE)${NC}"
    echo ""
    echo -e "${BLUE}📊 View test report for details:${NC}"
    echo "   npx playwright show-report"
fi

exit $TEST_EXIT_CODE


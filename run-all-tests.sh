#!/bin/bash
# SmartStore SaaS - Complete Test Suite Runner
# Bash script for Linux/Mac

set -e

echo "🧪 SmartStore SaaS Test Suite"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if dependencies are installed
echo -e "${YELLOW}📦 Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ Dependencies not installed. Running pnpm install...${NC}"
    pnpm install || exit 1
fi

echo -e "${GREEN}✅ Dependencies OK${NC}"
echo ""

# Install Playwright browsers if needed
echo -e "${YELLOW}🎭 Checking Playwright browsers...${NC}"

if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo "Installing Playwright Chromium..."
    npx playwright install --with-deps chromium
fi

echo -e "${GREEN}✅ Playwright browsers OK${NC}"
echo ""

# Setup test database
echo -e "${YELLOW}💾 Setting up test database...${NC}"

if [ ! -f ".env.test" ]; then
    echo -e "${YELLOW}⚠️  .env.test not found. Creating from example...${NC}"
    if [ -f ".env.test.example" ]; then
        cp .env.test.example .env.test
        echo -e "${YELLOW}⚠️  Please configure .env.test with your test database URL${NC}"
    fi
fi

# Generate Prisma client
echo "Generating Prisma client..."
pnpm db:generate > /dev/null 2>&1

echo -e "${GREEN}✅ Database setup OK${NC}"
echo ""

# Initialize test results
UNIT_PASSED=0
INTEGRATION_PASSED=0
E2E_PASSED=0

# Run Unit Tests
echo "================================"
echo -e "${CYAN}🧪 Running Unit Tests...${NC}"
echo "================================"
echo ""

if npx jest -c jest.config.unit.ts --runInBand --passWithNoTests; then
    echo -e "${GREEN}✅ Unit tests passed!${NC}"
    UNIT_PASSED=1
else
    echo -e "${RED}❌ Unit tests failed!${NC}"
fi

echo ""

# Run Integration Tests
echo "================================"
echo -e "${CYAN}🔗 Running Integration Tests...${NC}"
echo "================================"
echo ""

export NODE_ENV=test

if npx jest -c jest.config.integration.ts --runInBand --passWithNoTests; then
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
    INTEGRATION_PASSED=1
else
    echo -e "${RED}❌ Integration tests failed!${NC}"
fi

echo ""

# Run E2E Tests
echo "================================"
echo -e "${CYAN}🎭 Running E2E Tests (Playwright)...${NC}"
echo "================================"
echo ""

echo -e "${YELLOW}⚠️  Note: E2E tests require the dev server to be running${NC}"
echo "If server is not running, start it with: pnpm dev"
echo ""

if npx playwright test --reporter=list; then
    echo -e "${GREEN}✅ E2E tests passed!${NC}"
    E2E_PASSED=1
else
    echo -e "${RED}❌ E2E tests failed!${NC}"
fi

echo ""

# Summary
echo "================================"
echo -e "${CYAN}📊 Test Summary${NC}"
echo "================================"
echo ""

if [ $UNIT_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Unit Tests: FAILED${NC}"
fi

if [ $INTEGRATION_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Integration Tests: FAILED${NC}"
fi

if [ $E2E_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ E2E Tests: PASSED${NC}"
else
    echo -e "${RED}❌ E2E Tests: FAILED${NC}"
fi

echo ""

if [ $UNIT_PASSED -eq 1 ] && [ $INTEGRATION_PASSED -eq 1 ] && [ $E2E_PASSED -eq 1 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo -e "${CYAN}View detailed reports:${NC}"
    echo "  - Unit coverage: coverage/unit/index.html"
    echo "  - Integration coverage: coverage/integration/index.html"
    echo "  - Playwright report: npx playwright show-report"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo -e "${YELLOW}View Playwright report: npx playwright show-report${NC}"
    exit 1
fi


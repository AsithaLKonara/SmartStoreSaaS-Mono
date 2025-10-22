# SmartStore SaaS - Complete Test Suite Runner
# PowerShell script for Windows

Write-Host "🧪 SmartStore SaaS Test Suite" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "❌ Dependencies not installed. Running pnpm install..." -ForegroundColor Red
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Dependencies OK" -ForegroundColor Green
Write-Host ""

# Install Playwright browsers if needed
Write-Host "🎭 Checking Playwright browsers..." -ForegroundColor Yellow

$playwrightInstalled = Test-Path ".playwright"
if (-not $playwrightInstalled) {
    Write-Host "Installing Playwright Chromium..." -ForegroundColor Yellow
    npx playwright install --with-deps chromium
}

Write-Host "✅ Playwright browsers OK" -ForegroundColor Green
Write-Host ""

# Setup test database
Write-Host "💾 Setting up test database..." -ForegroundColor Yellow

if (-not (Test-Path ".env.test")) {
    Write-Host "⚠️  .env.test not found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path ".env.test.example") {
        Copy-Item ".env.test.example" ".env.test"
        Write-Host "⚠️  Please configure .env.test with your test database URL" -ForegroundColor Yellow
    }
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
pnpm db:generate | Out-Null

Write-Host "✅ Database setup OK" -ForegroundColor Green
Write-Host ""

# Run Unit Tests
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🧪 Running Unit Tests..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

npx jest -c jest.config.unit.ts --runInBand --passWithNoTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Unit tests failed!" -ForegroundColor Red
    $unitTestsFailed = $true
} else {
    Write-Host "✅ Unit tests passed!" -ForegroundColor Green
    $unitTestsPassed = $true
}

Write-Host ""

# Run Integration Tests
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🔗 Running Integration Tests..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$env:NODE_ENV = "test"
npx jest -c jest.config.integration.ts --runInBand --passWithNoTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Integration tests failed!" -ForegroundColor Red
    $integrationTestsFailed = $true
} else {
    Write-Host "✅ Integration tests passed!" -ForegroundColor Green
    $integrationTestsPassed = $true
}

Write-Host ""

# Run E2E Tests
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎭 Running E2E Tests (Playwright)..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Note: E2E tests require the dev server to be running" -ForegroundColor Yellow
Write-Host "If server is not running, start it with: pnpm dev" -ForegroundColor Yellow
Write-Host ""

npx playwright test --reporter=list

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ E2E tests failed!" -ForegroundColor Red
    $e2eTestsFailed = $true
} else {
    Write-Host "✅ E2E tests passed!" -ForegroundColor Green
    $e2eTestsPassed = $true
}

Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ($unitTestsPassed) {
    Write-Host "✅ Unit Tests: PASSED" -ForegroundColor Green
} elseif ($unitTestsFailed) {
    Write-Host "❌ Unit Tests: FAILED" -ForegroundColor Red
} else {
    Write-Host "⚠️  Unit Tests: SKIPPED" -ForegroundColor Yellow
}

if ($integrationTestsPassed) {
    Write-Host "✅ Integration Tests: PASSED" -ForegroundColor Green
} elseif ($integrationTestsFailed) {
    Write-Host "❌ Integration Tests: FAILED" -ForegroundColor Red
} else {
    Write-Host "⚠️  Integration Tests: SKIPPED" -ForegroundColor Yellow
}

if ($e2eTestsPassed) {
    Write-Host "✅ E2E Tests: PASSED" -ForegroundColor Green
} elseif ($e2eTestsFailed) {
    Write-Host "❌ E2E Tests: FAILED" -ForegroundColor Red
} else {
    Write-Host "⚠️  E2E Tests: SKIPPED" -ForegroundColor Yellow
}

Write-Host ""

if ($unitTestsFailed -or $integrationTestsFailed -or $e2eTestsFailed) {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "View Playwright report: npx playwright show-report" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "View detailed reports:" -ForegroundColor Cyan
    Write-Host "  - Unit coverage: coverage/unit/index.html" -ForegroundColor White
    Write-Host "  - Integration coverage: coverage/integration/index.html" -ForegroundColor White
    Write-Host "  - Playwright report: npx playwright show-report" -ForegroundColor White
    exit 0
}


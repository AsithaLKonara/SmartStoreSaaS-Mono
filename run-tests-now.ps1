# Quick test runner with output capture
$ErrorActionPreference = "Continue"

Write-Host "🧪 Running SmartStore SaaS Tests..." -ForegroundColor Cyan
Write-Host ""

# Run unit tests
Write-Host "Running unit tests..." -ForegroundColor Yellow
npx jest -c jest.config.unit.ts --runInBand --passWithNoTests --no-coverage 2>&1 | Tee-Object -FilePath "test-results-unit.txt"

Write-Host ""
Write-Host "Running integration tests..." -ForegroundColor Yellow
$env:NODE_ENV = "test"
npx jest -c jest.config.integration.ts --runInBand --passWithNoTests --no-coverage 2>&1 | Tee-Object -FilePath "test-results-integration.txt"

Write-Host ""
Write-Host "Running E2E tests..." -ForegroundColor Yellow
npx playwright test --reporter=list 2>&1 | Tee-Object -FilePath "test-results-e2e.txt"

Write-Host ""
Write-Host "✅ Test execution complete!" -ForegroundColor Green
Write-Host "Results saved to:" -ForegroundColor Cyan
Write-Host "  - test-results-unit.txt" -ForegroundColor White
Write-Host "  - test-results-integration.txt" -ForegroundColor White
Write-Host "  - test-results-e2e.txt" -ForegroundColor White


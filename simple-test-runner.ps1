# Simple test runner
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pnpm install --frozen-lockfile=false

Write-Host "`nRunning unit tests..." -ForegroundColor Yellow
pnpm jest -c jest.config.unit.js --runInBand --passWithNoTests

Write-Host "`nTest execution complete!" -ForegroundColor Green


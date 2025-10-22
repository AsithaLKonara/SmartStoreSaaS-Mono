@echo off
echo Running E2E tests with Playwright...
echo.
echo Note: Make sure dev server is running on localhost:3000
echo If not, run 'npm run dev' in another terminal first
echo.
pause
npx playwright test --reporter=list > e2e-test-output.log 2>&1
type e2e-test-output.log
echo.
echo E2E test execution complete!
echo View detailed report: npx playwright show-report


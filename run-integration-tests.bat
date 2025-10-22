@echo off
echo Running integration tests...
set NODE_ENV=test
npx jest -c jest.config.integration.js --runInBand --passWithNoTests > integration-test-output.log 2>&1
type integration-test-output.log
echo.
echo Integration test execution complete!


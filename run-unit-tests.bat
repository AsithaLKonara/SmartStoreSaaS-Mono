@echo off
echo Running unit tests...
npx jest -c jest.config.unit.js --runInBand --passWithNoTests > unit-test-output.log 2>&1
type unit-test-output.log
echo.
echo Unit test execution complete!

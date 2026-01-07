import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for E2E testing
 * 
 * Run tests: pnpm test:e2e
 * Debug tests: npx playwright test --headed
 * Generate report: npx playwright show-report
 */
export default defineConfig({
  testDir: './tests/e2e/flows',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  
  // Test timeout
  timeout: 60_000, // 60 seconds per test
  expect: {
    timeout: 5_000, // 5 seconds for assertions
  },
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Retry on CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 2 : undefined,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Global test configuration
  use: {
    // Base URL - Use local server by default, allow override via E2E_BASE_URL
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    
    // Browser options - Headless in CI, visible locally for debugging
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 800 },
    
    // Timeout for actions - Adjust for local server performance
    actionTimeout: process.env.CI ? 15_000 : 10_000,
    
    // Screenshot on failure (more efficient than 'on' for all actions)
    screenshot: 'only-on-failure',
    
    // Video on failure (saves disk space)
    video: 'retain-on-failure',
    
    // Trace on failure for debugging
    trace: 'on-first-retry',
    
    // Ignore HTTPS errors (for local testing)
    ignoreHTTPSErrors: true,
    
    // Slow down for visibility (only in local non-headless mode)
    slowMo: process.env.CI || process.env.HEADLESS ? 0 : 300,
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
  
  // Web server configuration
  // Auto-start local dev server before running tests
  // Only enable if E2E_BASE_URL is not explicitly set or is localhost
  webServer: process.env.E2E_BASE_URL && !process.env.E2E_BASE_URL.includes('localhost') ? undefined : {
    command: 'dotenv -e .env.test -- npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse if server already running (for local dev)
    timeout: 180_000, // 3 minutes for initial build
    stdout: 'pipe',
    stderr: 'pipe',
    // Wait for server to be ready by checking health endpoint
    // Fallback to just checking if port is open
  },
  
  // Output directory
  outputDir: 'test-results/',
});

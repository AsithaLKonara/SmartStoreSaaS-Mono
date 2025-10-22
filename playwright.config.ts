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
    // Base URL - LIVE DEPLOYMENT
    baseURL: process.env.E2E_BASE_URL ?? 'https://smart-store-saas-demo.vercel.app',
    
    // Browser options - VISIBLE BROWSER FOR USER VIEWING
    headless: false,
    viewport: { width: 1280, height: 800 },
    
    // Timeout for actions
    actionTimeout: 15_000, // Increased for live server
    
    // Screenshot ALL actions
    screenshot: 'on',
    
    // Video recording ALL tests
    video: 'on',
    
    // Trace ALL tests
    trace: 'on',
    
    // Ignore HTTPS errors (for local testing)
    ignoreHTTPSErrors: true,
    
    // Slow down for visibility
    slowMo: 500, // 500ms delay between actions for viewing
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
  // Uncomment to auto-start dev server before running tests
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
  
  // Output directory
  outputDir: 'test-results/',
});

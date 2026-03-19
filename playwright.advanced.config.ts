/**
 * Advanced Playwright Configuration for Ultra-Fast E2E Coverage
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  timeout: 300000,
  expect: { timeout: 15000 },
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'advanced-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 60000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npx dotenv-cli -e .env.test -- npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180000,
  },
});

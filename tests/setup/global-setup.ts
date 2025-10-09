import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Set up test environment
  await page.goto('http://localhost:3001')
  
  // Wait for the app to be ready
  await page.waitForLoadState('networkidle')
  
  // Create test data if needed
  // This could include setting up test users, products, etc.
  
  await browser.close()
}

export default globalSetup

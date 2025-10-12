import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  // Clean up test environment
  // This could include removing test data, cleaning up files, etc.
  
  console.log('E2E tests completed, cleaning up...')
}

export default globalTeardown

/**
 * Jest configuration for integration tests
 * Standalone config without Next.js dependency
 */
module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/integration/**/__tests__/**/*.spec.(ts|tsx|js)',
    '**/tests/integration/**/*.spec.(ts|tsx|js)',
  ],
  
  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  
  // No transform needed for JavaScript tests
  
  // Module name mapper (for path aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
  },
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Longer timeout for integration tests
  testTimeout: 30000,
  
  // Run tests serially (to avoid DB conflicts)
  maxWorkers: 1,
  
  // Verbose output
  verbose: true,
};


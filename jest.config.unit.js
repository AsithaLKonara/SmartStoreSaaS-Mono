/**
 * Jest configuration for unit tests
 * Standalone config without Next.js dependency
 * 
 * Run: npm test -- jest.config.unit.js
 */
module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',

  // Use ts-jest for TypeScript
  preset: 'ts-jest',

  // Test file patterns
  testMatch: [
    '**/tests/unit/**/__tests__/**/*.spec.(ts|tsx|js)',
    '**/tests/unit/**/*.spec.(ts|tsx|js)',
  ],

  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],

  // Module name mapper (for path aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform settings
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.*',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Test path ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

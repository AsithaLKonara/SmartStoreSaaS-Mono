import type { Config } from 'jest';

/**
 * Jest configuration for unit tests
 * 
 * Run: pnpm test:unit
 * Coverage: pnpm test:unit --coverage
 */
const config: Config = {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/unit/**/__tests__/**/*.spec.(ts|tsx|js)',
    '**/tests/unit/**/*.spec.(ts|tsx|js)',
  ],
  
  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  // Module name mapper (for path aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
  },
  
  // Coverage configuration
  collectCoverage: false, // Enable with --coverage flag
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
};

export default config;


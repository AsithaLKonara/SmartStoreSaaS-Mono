/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  // Suppress log, debug, info
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidCuid(received) {
    const cuidRegex = /^c[a-z0-9]{24}$/;
    const pass = cuidRegex.test(received);
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid CUID`
          : `expected ${received} to be a valid CUID (format: c + 24 alphanumeric characters)`,
    };
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email address`,
    };
  },
});

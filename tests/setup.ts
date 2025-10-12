
/**

 * Test Setup Configuration
 * 
 * This file configures the test environment for all tests.
 * It sets up mocks, global configurations, and test utilities.
 */

import { jest } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Headers;
    nextUrl: URL;

    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers as HeadersInit);
      this.nextUrl = new URL(this.url);
    }

    json() {
      return Promise.resolve({});
    }
  },
  
  NextResponse: class NextResponse {
    status: number;
    headers: Headers;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers as HeadersInit);
    }

    static json(data: any, init?: ResponseInit) {
      return new NextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }

    headers = new Headers();
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    delivery: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    courier: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activity: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/smartstore_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.MFA_ENCRYPTION_KEY = 'test-mfa-encryption-key';

// Global test utilities
global.testUtils = {
  createMockRequest: (url: string, options: any = {}) => {
    return {
      url,
      method: options.method || 'GET',
      headers: new Headers(options.headers || {}),
      nextUrl: new URL(url),
      json: jest.fn().mockResolvedValue(options.body || {}),
    };
  },
  
  createMockResponse: (data: any = {}, status: number = 200) => {
    return {
      status,
      headers: new Headers(),
      json: jest.fn().mockReturnValue(data),
    };
  },
  
  createMockSession: (overrides: any = {}) => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'STAFF',
      ...overrides.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }),
  
  createMockOrganization: (overrides: any = {}) => ({
    id: 'org-123',
    name: 'Test Organization',
    domain: 'test.com',
    plan: 'PRO',
    status: 'ACTIVE',
    isActive: true,
    settings: {
      description: 'Test organization',
      theme: 'light',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockCustomer: (overrides: any = {}) => ({
    id: 'customer-123',
    email: 'customer@example.com',
    name: 'Test Customer',
    phone: '+1234567890',
    organizationId: 'org-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockProduct: (overrides: any = {}) => ({
    id: 'product-123',
    name: 'Test Product',
    description: 'Test product description',
    price: 99.99,
    sku: 'TEST-001',
    stock: 100,
    images: [],
    organizationId: 'org-123',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockOrder: (overrides: any = {}) => ({
    id: 'order-123',
    orderNumber: 'ORD-001',
    customerId: 'customer-123',
    organizationId: 'org-123',
    createdById: 'user-123',
    status: 'PENDING',
    total: 99.99,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockFetch: (response: any, status: number = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(response),
      text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    });
  },
};

// Extend global types
declare global {
  var testUtils: {
    createMockRequest: (url: string, options?: any) => any;
    createMockResponse: (data?: any, status?: number) => any;
    createMockSession: (overrides?: any) => any;
    createMockOrganization: (overrides?: any) => any;
    createMockCustomer: (overrides?: any) => any;
    createMockProduct: (overrides?: any) => any;
    createMockOrder: (overrides?: any) => any;
    waitFor: (ms: number) => Promise<void>;
    mockFetch: (response: any, status?: number) => void;
  };
}

// Setup global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Console setup for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress expected error messages in tests
  const message = args[0];
  if (typeof message === 'string') {
    if (
      message.includes('Warning:') ||
      message.includes('Error:') ||
      message.includes('Failed to') ||
      message.includes('Database error') ||
      message.includes('Authentication error')
    ) {
      return;
    }
  }
  originalConsoleError(...args);
};

// Jest configuration
jest.setTimeout(30000); // 30 second timeout for all tests

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  jest.restoreAllMocks();
});

export {};

import { jest } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Headers;
    nextUrl: URL;

    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers as HeadersInit);
      this.nextUrl = new URL(this.url);
    }

    json() {
      return Promise.resolve({});
    }
  },
  
  NextResponse: class NextResponse {
    status: number;
    headers: Headers;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers as HeadersInit);
    }

    static json(data: any, init?: ResponseInit) {
      return new NextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }

    headers = new Headers();
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    delivery: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    courier: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activity: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/smartstore_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.MFA_ENCRYPTION_KEY = 'test-mfa-encryption-key';

// Global test utilities
global.testUtils = {
  createMockRequest: (url: string, options: any = {}) => {
    return {
      url,
      method: options.method || 'GET',
      headers: new Headers(options.headers || {}),
      nextUrl: new URL(url),
      json: jest.fn().mockResolvedValue(options.body || {}),
    };
  },
  
  createMockResponse: (data: any = {}, status: number = 200) => {
    return {
      status,
      headers: new Headers(),
      json: jest.fn().mockReturnValue(data),
    };
  },
  
  createMockSession: (overrides: any = {}) => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'STAFF',
      ...overrides.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }),
  
  createMockOrganization: (overrides: any = {}) => ({
    id: 'org-123',
    name: 'Test Organization',
    domain: 'test.com',
    plan: 'PRO',
    status: 'ACTIVE',
    isActive: true,
    settings: {
      description: 'Test organization',
      theme: 'light',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockCustomer: (overrides: any = {}) => ({
    id: 'customer-123',
    email: 'customer@example.com',
    name: 'Test Customer',
    phone: '+1234567890',
    organizationId: 'org-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockProduct: (overrides: any = {}) => ({
    id: 'product-123',
    name: 'Test Product',
    description: 'Test product description',
    price: 99.99,
    sku: 'TEST-001',
    stock: 100,
    images: [],
    organizationId: 'org-123',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockOrder: (overrides: any = {}) => ({
    id: 'order-123',
    orderNumber: 'ORD-001',
    customerId: 'customer-123',
    organizationId: 'org-123',
    createdById: 'user-123',
    status: 'PENDING',
    total: 99.99,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockFetch: (response: any, status: number = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(response),
      text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    });
  },
};

// Extend global types
declare global {
  var testUtils: {
    createMockRequest: (url: string, options?: any) => any;
    createMockResponse: (data?: any, status?: number) => any;
    createMockSession: (overrides?: any) => any;
    createMockOrganization: (overrides?: any) => any;
    createMockCustomer: (overrides?: any) => any;
    createMockProduct: (overrides?: any) => any;
    createMockOrder: (overrides?: any) => any;
    waitFor: (ms: number) => Promise<void>;
    mockFetch: (response: any, status?: number) => void;
  };
}

// Setup global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Console setup for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress expected error messages in tests
  const message = args[0];
  if (typeof message === 'string') {
    if (
      message.includes('Warning:') ||
      message.includes('Error:') ||
      message.includes('Failed to') ||
      message.includes('Database error') ||
      message.includes('Authentication error')
    ) {
      return;
    }
  }
  originalConsoleError(...args);
};

// Jest configuration
jest.setTimeout(30000); // 30 second timeout for all tests

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  jest.restoreAllMocks();
});

export {};


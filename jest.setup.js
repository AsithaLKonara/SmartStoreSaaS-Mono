import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock NextResponse
const MockResponse = class MockResponse {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this._headers = new Map(Object.entries(options.headers || {}))
  }
  
  get headers() {
    return {
      get: (name) => this._headers.get(name),
      set: (name, value) => this._headers.set(name, value)
    }
  }
  
  json() {
    return this.body
  }
  
  static json(data, options = {}) {
    return new MockResponse(data, options)
  }
}

jest.mock('next/server', () => ({
  NextResponse: MockResponse,
}))

// Mock Prisma for tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    product: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    organization: {
      findUnique: jest.fn().mockResolvedValue({ id: 'test-org', name: 'Test Organization' }),
    },
  },
}))

// Mock TextEncoder for Node.js environment
global.TextEncoder = class TextEncoder {
  encode(input) {
    return Buffer.from(input, 'utf8')
  }
}

global.TextDecoder = class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString('utf8')
  }
}

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock Request and Response globals for Node.js environment
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this._headers = new Map(Object.entries(options.headers || {}))
  }
  
  get headers() {
    return {
      get: (name) => this._headers.get(name)
    }
  }
}

global.Response = MockResponse

// Console error suppression for tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})


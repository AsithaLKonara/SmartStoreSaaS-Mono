import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    // Ramp up to 50 users over 2 minutes
    { duration: '2m', target: 50 },
    // Stay at 50 users for 3 minutes
    { duration: '3m', target: 50 },
    // Ramp up to 200 users over 5 minutes
    { duration: '5m', target: 200 },
    // Stay at 200 users for 5 minutes
    { duration: '5m', target: 200 },
    // Ramp up to 500 users over 5 minutes
    { duration: '5m', target: 500 },
    // Stay at 500 users for 5 minutes
    { duration: '5m', target: 500 },
    // Ramp down to 0 users over 2 minutes
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 95% of requests must complete below 250ms
    http_req_duration: ['p(95)<250'],
    // Error rate must be below 1%
    errors: ['rate<0.01'],
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
  },
};

// Test scenarios
const scenarios = {
  // Health check (public endpoint)
  healthCheck: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
      'health check has correct content type': (r) => r.headers['Content-Type']?.includes('application/json'),
    });
    errorRate.add(response.status !== 200);
  },

  // Products API (protected endpoint - will return 401 without auth)
  productsAPI: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/products?limit=10`);
    check(response, {
      'products API response time < 200ms': (r) => r.timings.duration < 200,
      'products API has security headers': (r) => r.headers['X-Frame-Options'] === 'DENY',
      'products API has CORS headers': (r) => r.headers['Access-Control-Allow-Origin'],
    });
    errorRate.add(response.status !== 401); // Expected 401 without auth
  },

  // Search API (protected endpoint)
  searchAPI: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/search?q=test&type=products`);
    check(response, {
      'search API response time < 300ms': (r) => r.timings.duration < 300,
      'search API has security headers': (r) => r.headers['X-Frame-Options'] === 'DENY',
    });
    errorRate.add(response.status !== 401); // Expected 401 without auth
  },

  // Customers API (protected endpoint)
  customersAPI: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/customers?limit=10`);
    check(response, {
      'customers API response time < 250ms': (r) => r.timings.duration < 250,
      'customers API has security headers': (r) => r.headers['X-Frame-Options'] === 'DENY',
    });
    errorRate.add(response.status !== 401); // Expected 401 without auth
  },

  // Orders API (protected endpoint)
  ordersAPI: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/orders?limit=10`);
    check(response, {
      'orders API response time < 300ms': (r) => r.timings.duration < 300,
      'orders API has security headers': (r) => r.headers['X-Frame-Options'] === 'DENY',
    });
    errorRate.add(response.status !== 401); // Expected 401 without auth
  },

  // Chat conversations API (protected endpoint)
  chatAPI: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/chat/conversations?limit=10`);
    check(response, {
      'chat API response time < 250ms': (r) => r.timings.duration < 250,
      'chat API has security headers': (r) => r.headers['X-Frame-Options'] === 'DENY',
    });
    errorRate.add(response.status !== 401); // Expected 401 without auth
  },

  // Readiness check (public endpoint)
  readinessCheck: () => {
    const response = http.get(`${__ENV.BASE_URL}/api/readyz`);
    check(response, {
      'readiness check status is 200': (r) => r.status === 200,
      'readiness check response time < 150ms': (r) => r.timings.duration < 150,
      'readiness check has correct content type': (r) => r.headers['Content-Type']?.includes('application/json'),
    });
    errorRate.add(response.status !== 200);
  },
};

// Main test function
export default function () {
  // Run all scenarios
  scenarios.healthCheck();
  sleep(0.1);
  
  scenarios.productsAPI();
  sleep(0.1);
  
  scenarios.searchAPI();
  sleep(0.1);
  
  scenarios.customersAPI();
  sleep(0.1);
  
  scenarios.ordersAPI();
  sleep(0.1);
  
  scenarios.chatAPI();
  sleep(0.1);
  
  scenarios.readinessCheck();
  sleep(0.1);
  
  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Starting load test for SmartStore SaaS');
  console.log(`Base URL: ${__ENV.BASE_URL || 'http://localhost:3000'}`);
  console.log('Testing endpoints for performance and security compliance');
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
  console.log('Check the results for performance metrics and security compliance');
}

// Handle test configuration
if (!__ENV.BASE_URL) {
  console.warn('BASE_URL not set, defaulting to http://localhost:3000');
  __ENV.BASE_URL = 'http://localhost:3000';
}

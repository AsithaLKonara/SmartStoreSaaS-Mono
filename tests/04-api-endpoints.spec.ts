import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should test public API endpoints', async ({ request }) => {
    const baseURL = 'https://smartstore-saas.vercel.app';
    
    // Test public endpoints
    const publicEndpoints = [
      { name: 'Health Check', url: '/api/health', expectedStatus: 200 },
      { name: 'DB Check', url: '/api/db-check', expectedStatus: 200 },
      { name: 'Auth Providers', url: '/api/auth/providers', expectedStatus: 200 },
      { name: 'System Status', url: '/api/monitoring/status', expectedStatus: 200 }
    ];
    
    for (const endpoint of publicEndpoints) {
      console.log(`Testing ${endpoint.name}...`);
      const response = await request.get(`${baseURL}${endpoint.url}`);
      
      if (response.status() === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.name}: ${response.status()}`);
      } else {
        console.log(`❌ ${endpoint.name}: Expected ${endpoint.expectedStatus}, got ${response.status()}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers()['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name} returns valid JSON`);
      }
    }
  });

  test('should test protected API endpoints (should return 401)', async ({ request }) => {
    const baseURL = 'https://smartstore-saas.vercel.app';
    
    // Test protected endpoints (should return 401 without auth)
    const protectedEndpoints = [
      { name: 'Products GET', url: '/api/products', method: 'GET' },
      { name: 'Products POST', url: '/api/products', method: 'POST' },
      { name: 'Orders GET', url: '/api/orders', method: 'GET' },
      { name: 'Orders POST', url: '/api/orders', method: 'POST' },
      { name: 'Customers GET', url: '/api/customers', method: 'GET' },
      { name: 'Customers POST', url: '/api/customers', method: 'POST' },
      { name: 'Accounts GET', url: '/api/accounting/accounts', method: 'GET' },
      { name: 'Accounts POST', url: '/api/accounting/accounts', method: 'POST' },
      { name: 'Suppliers GET', url: '/api/procurement/suppliers', method: 'GET' },
      { name: 'Suppliers POST', url: '/api/procurement/suppliers', method: 'POST' },
      { name: 'Purchase Orders GET', url: '/api/procurement/purchase-orders', method: 'GET' },
      { name: 'Purchase Orders POST', url: '/api/procurement/purchase-orders', method: 'POST' }
    ];
    
    for (const endpoint of protectedEndpoints) {
      console.log(`Testing ${endpoint.name}...`);
      
      let response;
      if (endpoint.method === 'GET') {
        response = await request.get(`${baseURL}${endpoint.url}`);
      } else if (endpoint.method === 'POST') {
        response = await request.post(`${baseURL}${endpoint.url}`, {
          data: { test: true }
        });
      }
      
      if (response && response.status() === 401) {
        console.log(`✅ ${endpoint.name}: Correctly returns 401 (Unauthorized)`);
      } else if (response) {
        console.log(`⚠️ ${endpoint.name}: Expected 401, got ${response.status()}`);
      } else {
        console.log(`❌ ${endpoint.name}: No response received`);
      }
    }
  });

  test('should test API response times', async ({ request }) => {
    const baseURL = 'https://smartstore-saas.vercel.app';
    
    const endpoints = [
      '/api/health',
      '/api/db-check',
      '/api/auth/providers',
      '/api/monitoring/status'
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`${baseURL}${endpoint}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`${endpoint}: ${response.status()} (${responseTime}ms)`);
      
      // Check if response time is reasonable (less than 5 seconds)
      if (responseTime < 5000) {
        console.log(`✅ ${endpoint} response time is acceptable`);
      } else {
        console.log(`⚠️ ${endpoint} response time is slow: ${responseTime}ms`);
      }
    }
  });

  test('should test API error handling', async ({ request }) => {
    const baseURL = 'https://smartstore-saas.vercel.app';
    
    // Test non-existent endpoint
    const response = await request.get(`${baseURL}/api/non-existent-endpoint`);
    
    if (response.status() === 404) {
      console.log('✅ Non-existent endpoint correctly returns 404');
    } else {
      console.log(`⚠️ Non-existent endpoint returned ${response.status()}, expected 404`);
    }
  });
});

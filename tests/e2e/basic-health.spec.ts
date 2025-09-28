import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('SmartStore SaaS - Basic Health Tests', () => {
  test.describe('Server Health', () => {
    test('should respond to homepage', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/`);
      expect(response.status()).toBe(200);
    });

    test('should respond to health check endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('healthy');
    });

    test('should respond to ready check endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/ready`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ready');
    });
  });

  test.describe('API Structure', () => {
    test('should handle invalid JSON requests', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register-request/`, {
        data: { invalid: 'json' }, // Send valid JSON but missing required fields
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // Should return 400 for missing required fields
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Performance', () => {
    test('should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}/api/health`);
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});



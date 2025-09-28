import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('SmartStore SaaS - API Only Tests', () => {
  test.describe('Health Checks', () => {
    test('should respond to health check endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
    });

    test('should respond to ready check endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/ready`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
    });
  });

  test.describe('API Endpoints', () => {
    test('should fetch packages API', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/packages/`);
      expect(response.status()).toBe(200);
      
      const packages = await response.json();
      expect(Array.isArray(packages)).toBe(true);
    });

    test('should fetch courier services API', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/courier/services/`);
      expect(response.status()).toBe(200);
      
      const services = await response.json();
      expect(Array.isArray(services)).toBe(true);
    });

    test('should fetch warehouse API', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/warehouses/`);
      expect(response.status()).toBe(200);
      
      const warehouses = await response.json();
      expect(Array.isArray(warehouses)).toBe(true);
    });

    test('should create warehouse', async ({ request }) => {
      const warehouseData = {
        name: 'Test Warehouse API',
        address: '123 Test Street',
        capacity: 1000
      };

      const response = await request.post(`${BASE_URL}/api/warehouses/`, {
        data: warehouseData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Warehouse API');
    });
  });

  test.describe('Registration API', () => {
    test('should handle registration request', async ({ request }) => {
      const testData = {
        businessName: 'Test Business API',
        contactName: 'John Doe',
        email: 'test@example.com',
        phone: '+94 77 123 4567',
        address: {
          street: '123 Test Street',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00100'
        },
        password: 'testpassword123',
        selectedPackageId: 'cmfvk2j200000udj9tbuo83yu', // Use a real package ID
        paymentChoice: 'TRIAL'
      };

      const response = await request.post(`${BASE_URL}/api/auth/register-request/`, {
        data: testData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  test.describe('Admin APIs', () => {
    test('should fetch admin dashboard stats', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/dashboard/stats/`);
      
      expect(response.status()).toBe(200);
      const stats = await response.json();
      
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('pendingRequests');
      expect(stats).toHaveProperty('monthlyRevenue');
    });

    test('should fetch registration requests', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/registration-requests/`);
      
      expect(response.status()).toBe(200);
      const requests = await response.json();
      
      expect(Array.isArray(requests)).toBe(true);
    });
  });

  test.describe('Package Management', () => {
    test('should create a new package', async ({ request }) => {
      const newPackage = {
        name: 'Test Package API',
        description: 'A test package created via API',
        price: 99.99,
        currency: 'LKR',
        billingCycle: 'MONTHLY',
        features: {
          maxUsers: 10,
          maxOrders: 1000,
          maxStorage: 1000
        },
        isActive: true,
        isTrial: false,
        trialDays: 0,
        maxUsers: 10,
        maxOrders: 1000,
        maxStorage: 1000
      };

      const response = await request.post(`${BASE_URL}/api/admin/packages/`, {
        data: newPackage
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle malformed JSON requests', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register-request/`, {
        data: { invalid: 'json' }, // Send valid JSON but missing required fields
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(response.status()).toBe(400);
    });
  });
});



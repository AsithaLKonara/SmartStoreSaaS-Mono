import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('SmartStore SaaS Platform - Simplified E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
  });

  test.describe('Application Health', () => {
    test('should load the homepage without errors', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check that the page loads without 500 errors
      const response = await page.waitForResponse(response => 
        response.url().includes(BASE_URL) && response.status() < 500
      );
      
      expect(response.status()).toBeLessThan(500);
      
      // Check for basic page elements
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have working navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check if signup link exists and is clickable
      const signupLink = page.locator('a[href="/signup"]').first();
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await expect(page).toHaveURL(/.*signup/);
      }
    });
  });

  test.describe('API Health Checks', () => {
    test('should respond to health check endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health/`);
      expect(response.status()).toBe(200);
    });

    test('should respond to ready check endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/ready/`);
      expect(response.status()).toBe(200);
    });

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
  });

  test.describe('Registration API', () => {
    test('should handle registration request', async ({ request }) => {
      const testData = {
        businessName: 'API Test Business',
        contactName: 'API Test User',
        email: `apitest${Date.now()}@example.com`,
        phone: '+94 77 123 4567',
        address: {
          street: '123 API Test Street',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00100'
        },
        password: 'testpassword123',
        selectedPackageId: 'starter',
        paymentChoice: 'trial'
      };

      const response = await request.post(`${BASE_URL}/api/auth/register-request/`, {
        data: testData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    test('should reject invalid registration data', async ({ request }) => {
      const invalidData = {
        email: 'invalid-email'
      };

      const response = await request.post(`${BASE_URL}/api/auth/register-request/`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  test.describe('Admin APIs', () => {
    test('should fetch admin dashboard stats', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/dashboard/stats/`);
      
      expect(response.status()).toBe(200);
      const stats = await response.json();
      
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeSubscriptions');
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
        name: 'Test Package',
        description: 'A test package for API testing',
        price: 5000,
        currency: 'LKR',
        billingCycle: 'MONTHLY',
        features: {
          'max_products': 50,
          'inventory_management': true,
          'order_management': true,
          'email_support': true
        },
        isActive: true,
        isTrial: false,
        trialDays: 7,
        maxUsers: 2,
        maxOrders: 25,
        maxStorage: 50
      };

      const response = await request.post(`${BASE_URL}/api/admin/packages/`, {
        data: newPackage
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Package');
    });

    test('should fetch all packages', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/packages`);
      
      expect(response.status()).toBe(200);
      const packages = await response.json();
      
      expect(Array.isArray(packages)).toBe(true);
      expect(packages.length).toBeGreaterThan(0);
    });
  });

  test.describe('Courier Integration', () => {
    test('should setup courier integration', async ({ request }) => {
      const integrationData = {
        courierServiceId: 'domex',
        apiKey: 'test-api-key-123',
        apiSecret: 'test-api-secret-456'
      };

      const response = await request.post(`${BASE_URL}/api/courier/integrations/`, {
        data: integrationData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    test('should fetch deliveries', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/courier/deliveries/`);
      
      expect(response.status()).toBe(200);
      const deliveries = await response.json();
      
      expect(Array.isArray(deliveries)).toBe(true);
    });
  });

  test.describe('WhatsApp Integration', () => {
    test('should setup WhatsApp integration', async ({ request }) => {
      const integrationData = {
        phoneNumber: '+94771234567',
        accessToken: 'test-whatsapp-token-123',
        webhookUrl: 'https://example.com/webhook'
      };

      const response = await request.post(`${BASE_URL}/api/integrations/whatsapp/`, {
        data: integrationData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    test('should handle WhatsApp webhook', async ({ request }) => {
      const webhookData = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'test-message-id',
                from: '94771234567',
                text: { body: 'Test webhook message' },
                timestamp: Math.floor(Date.now() / 1000).toString()
              }],
              metadata: {
                phone_number_id: 'test-phone-id'
              }
            }
          }]
        }]
      };

      const response = await request.post(`${BASE_URL}/api/integrations/whatsapp/webhook/`, {
        data: webhookData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  test.describe('Warehouse Management', () => {
    test('should create warehouse', async ({ request }) => {
      const warehouseData = {
        name: 'Test Warehouse',
        address: {
          street: '123 Warehouse Street',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00100'
        },
        capacity: 1000
      };

      const response = await request.post(`${BASE_URL}/api/warehouses/`, {
        data: warehouseData
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Warehouse');
    });

    test('should fetch inventory', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/warehouses/inventory/`);
      
      expect(response.status()).toBe(200);
      const inventory = await response.json();
      
      expect(Array.isArray(inventory)).toBe(true);
    });

    test('should fetch inventory movements', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/warehouses/movements/`);
      
      expect(response.status()).toBe(200);
      const movements = await response.json();
      
      expect(Array.isArray(movements)).toBe(true);
    });
  });

  test.describe('Billing System', () => {
    test('should fetch billing dashboard data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/billing/dashboard/`);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('organization');
      expect(data).toHaveProperty('activeSubscription');
      expect(data).toHaveProperty('totalPaid');
      expect(data).toHaveProperty('pendingInvoices');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 errors gracefully', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/nonexistent-endpoint`);
      expect(response.status()).toBe(404);
    });

    test('should handle malformed JSON requests', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register-request/`, {
        data: 'invalid json string'
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Database Connectivity', () => {
    test('should verify database operations work', async ({ request }) => {
      // Test a simple API that requires database access
      const response = await request.get(`${BASE_URL}/api/admin/packages`);
      
      expect(response.status()).toBe(200);
      const packages = await response.json();
      
      // Verify we got data from the database
      expect(Array.isArray(packages)).toBe(true);
    });
  });
});



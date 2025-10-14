/**
 * API Mocking Setup for Tests
 * Mocks external API calls to prevent timeouts and ensure predictable test behavior
 */

import { Page } from '@playwright/test';

/**
 * Mock analytics API responses
 */
export async function mockAnalyticsAPI(page: Page) {
  await page.route('**/api/analytics/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/dashboard')) {
      // Mock dashboard analytics
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          revenue: { current: 125000, previous: 110000, change: 13.6 },
          orders: { current: 1234, previous: 1100, change: 12.2 },
          customers: { current: 567, previous: 543, change: 4.4 },
          conversion: { current: 3.2, previous: 2.9, change: 10.3 },
          chartData: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            revenue: 15000 + Math.random() * 5000,
            orders: 150 + Math.random() * 50
          }))
        })
      });
    } else {
      // Default analytics response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 })
      });
    }
  });
}

/**
 * Mock reports API responses
 */
export async function mockReportsAPI(page: Page) {
  await page.route('**/api/reports/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reports: [
          { id: '1', name: 'Sales Report', type: 'sales', status: 'completed', createdAt: new Date().toISOString() },
          { id: '2', name: 'Inventory Report', type: 'inventory', status: 'completed', createdAt: new Date().toISOString() }
        ],
        total: 2
      })
    });
  });
}

/**
 * Mock AI/ML API responses
 */
export async function mockAIAPI(page: Page) {
  await page.route('**/api/ai/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/insights')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          insights: [
            { type: 'trend', message: 'Sales increased by 15% this week', confidence: 0.89 },
            { type: 'prediction', message: 'Expected inventory shortage in 7 days', confidence: 0.76 }
          ]
        })
      });
    } else if (url.includes('/recommendations')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recommendations: [
            { productId: 'test-product-1', reason: 'frequently_bought_together', score: 0.85 },
            { productId: 'test-product-2', reason: 'similar_products', score: 0.78 }
          ]
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    }
  });
}

/**
 * Mock external integration APIs
 */
export async function mockIntegrationAPIs(page: Page) {
  // Mock Stripe
  await page.route('**/api/payments/stripe/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        clientSecret: 'mock_client_secret_123',
        paymentIntentId: 'pi_mock_123'
      })
    });
  });

  // Mock PayHere
  await page.route('**/api/payments/payhere/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        merchantId: 'mock_merchant',
        hash: 'mock_hash',
        orderId: 'mock_order_123'
      })
    });
  });

  // Mock Shopify
  await page.route('**/api/integrations/shopify/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connected: true,
        products: 0,
        lastSync: new Date().toISOString()
      })
    });
  });

  // Mock WooCommerce
  await page.route('**/api/integrations/woocommerce/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connected: true,
        products: 0,
        lastSync: new Date().toISOString()
      })
    });
  });

  // Mock WhatsApp
  await page.route('**/api/integrations/whatsapp/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        messageId: 'mock_msg_123'
      })
    });
  });

  // Mock Email
  await page.route('**/api/email/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        messageId: 'mock_email_123'
      })
    });
  });

  // Mock SMS
  await page.route('**/api/sms/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        messageId: 'mock_sms_123'
      })
    });
  });
}

/**
 * Mock slow loading APIs with instant responses
 */
export async function mockSlowAPIs(page: Page) {
  // Mock any API that typically takes a long time
  const slowEndpoints = [
    '**/api/monitoring/**',
    '**/api/logs/**',
    '**/api/audit/**',
    '**/api/backup/**',
    '**/api/export/**'
  ];

  for (const endpoint of slowEndpoints) {
    await page.route(endpoint, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          data: [], 
          message: 'Mocked response for testing' 
        })
      });
    });
  }
}

/**
 * Setup all API mocks for testing
 */
export async function setupAPIMocks(page: Page) {
  console.log('🎭 Setting up API mocks...');
  
  // Only mock if MOCK_EXTERNAL_APIS is true
  const shouldMock = process.env.MOCK_EXTERNAL_APIS === 'true';
  
  if (!shouldMock) {
    console.log('ℹ️ API mocking disabled');
    return;
  }
  
  await mockAnalyticsAPI(page);
  await mockReportsAPI(page);
  await mockAIAPI(page);
  await mockIntegrationAPIs(page);
  await mockSlowAPIs(page);
  
  console.log('✅ API mocks configured');
}

/**
 * Clear all API mocks
 */
export async function clearAPIMocks(page: Page) {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}

/**
 * Verify mock was called
 */
export function createMockVerifier(page: Page) {
  const calls: Map<string, number> = new Map();
  
  page.on('request', (request) => {
    const url = request.url();
    calls.set(url, (calls.get(url) || 0) + 1);
  });
  
  return {
    wasCalled: (urlPattern: string): boolean => {
      for (const [url] of calls) {
        if (url.includes(urlPattern)) {
          return true;
        }
      }
      return false;
    },
    
    getCallCount: (urlPattern: string): number => {
      let count = 0;
      for (const [url, callCount] of calls) {
        if (url.includes(urlPattern)) {
          count += callCount;
        }
      }
      return count;
    },
    
    reset: () => {
      calls.clear();
    }
  };
}




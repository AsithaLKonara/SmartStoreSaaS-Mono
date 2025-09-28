import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Comprehensive Deployment Test Suite
// Tests all aspects of the SmartStore SaaS deployment

describe('Comprehensive Deployment Tests', () => {
  const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || 'smartstore-saas-demo.vercel.app';
  const BASE_URL = `https://${CUSTOM_DOMAIN}`;
  
  beforeAll(async () => {
    console.log(`🚀 Starting Comprehensive Deployment Tests`);
    console.log(`🌐 Testing domain: ${BASE_URL}`);
  });

  afterAll(async () => {
    console.log('✅ Comprehensive deployment tests completed');
  });

  describe('🌐 Domain & SSL Configuration', () => {
    it('should have valid custom domain', () => {
      expect(CUSTOM_DOMAIN).toBeDefined();
      expect(CUSTOM_DOMAIN).toMatch(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
    });

    it('should use HTTPS protocol', () => {
      expect(BASE_URL).toMatch(/^https:\/\//);
    });

    it('should have valid SSL certificate', async () => {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      expect(response.ok).toBe(true);
      expect(response.url).toMatch(/^https:\/\//);
    });

    it('should redirect HTTP to HTTPS', async () => {
      const httpUrl = `http://${CUSTOM_DOMAIN}`;
      const response = await fetch(httpUrl, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toMatch(/^https:\/\//);
    });
  });

  describe('🔒 Security Headers', () => {
    it('should have all required security headers', async () => {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      const headers = response.headers;
      
      expect(headers.get('x-frame-options')).toBe('DENY');
      expect(headers.get('x-content-type-options')).toBe('nosniff');
      expect(headers.get('referrer-policy')).toBeDefined();
      expect(headers.get('strict-transport-security')).toContain('max-age=31536000');
      expect(headers.get('cross-origin-embedder-policy')).toBe('require-corp');
      expect(headers.get('cross-origin-opener-policy')).toBe('same-origin');
      expect(headers.get('cross-origin-resource-policy')).toBe('same-origin');
    });

    it('should have Content Security Policy', async () => {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      const csp = response.headers.get('content-security-policy');
      
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
    });
  });

  describe('🌍 CORS Configuration', () => {
    it('should allow custom domain origin', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': BASE_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    });

    it('should handle preflight requests correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': BASE_URL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });

    it('should reject unauthorized origins', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      // Should either reject or not allow the origin
      const allowedOrigin = response.headers.get('access-control-allow-origin');
      expect(allowedOrigin).not.toBe('https://malicious-site.com');
    });
  });

  describe('🔌 API Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    it('should handle organization API with proper CORS', async () => {
      const response = await fetch(`${BASE_URL}/api/settings/organization`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(401); // Unauthorized without auth
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
    });

    it('should handle products API with proper CORS', async () => {
      const response = await fetch(`${BASE_URL}/api/products`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(401); // Unauthorized without auth
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
    });

    it('should handle customers API with proper CORS', async () => {
      const response = await fetch(`${BASE_URL}/api/customers`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(401); // Unauthorized without auth
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
    });

    it('should handle orders API with proper CORS', async () => {
      const response = await fetch(`${BASE_URL}/api/orders`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(401); // Unauthorized without auth
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
    });
  });

  describe('🔐 Authentication', () => {
    it('should handle NextAuth configuration', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/providers`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it('should have correct NextAuth URL configuration', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`);
      expect(response.ok).toBe(true);
    });

    it('should handle authentication callbacks', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      // Should handle the request (even if it fails due to missing credentials)
      expect([200, 400, 401, 405]).toContain(response.status);
    });
  });

  describe('📱 Static Assets & Performance', () => {
    it('should serve static assets', async () => {
      const response = await fetch(`${BASE_URL}/favicon.ico`);
      expect(response.ok).toBe(true);
    });

    it('should have proper caching headers for static assets', async () => {
      const response = await fetch(`${BASE_URL}/_next/static/css/app.css`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        expect(response.headers.get('cache-control')).toContain('max-age');
      }
    });

    it('should load within acceptable time', async () => {
      const startTime = Date.now();
      const response = await fetch(BASE_URL);
      const endTime = Date.now();
      
      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() => fetch(`${BASE_URL}/api/health`));
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('🗄️ Database Integration', () => {
    it('should connect to database', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    it('should handle database queries with custom domain', async () => {
      const response = await fetch(`${BASE_URL}/api/settings/organization`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      // Should handle the request even if unauthorized
      expect(response.status).toBe(401);
    });
  });

  describe('🛡️ Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await fetch(`${BASE_URL}/non-existent-page`);
      expect(response.status).toBe(404);
    });

    it('should handle API errors gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });
      
      // Should handle malformed requests gracefully
      expect([200, 400, 422]).toContain(response.status);
    });
  });

  describe('🌐 Custom Domain Features', () => {
    it('should support custom domain routing', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.ok).toBe(true);
    });

    it('should handle subdomain routing', async () => {
      const subdomainUrl = `https://app.${CUSTOM_DOMAIN}`;
      const response = await fetch(subdomainUrl, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      
      // Should either work or redirect appropriately
      expect([200, 301, 302, 404]).toContain(response.status);
    });

    it('should maintain session across custom domain', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: {
          'Origin': BASE_URL,
          'Cookie': 'test-session=test-value'
        }
      });
      
      expect(response.ok).toBe(true);
    });
  });

  describe('📊 Monitoring & Analytics', () => {
    it('should have proper response headers for monitoring', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle monitoring requests', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        headers: {
          'User-Agent': 'monitoring-bot/1.0'
        }
      });
      
      expect(response.ok).toBe(true);
    });
  });

  describe('🔄 Integration Testing', () => {
    it('should handle complete workflow with custom domain', async () => {
      // Test a complete workflow: health check -> auth -> API
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      expect(healthResponse.ok).toBe(true);

      const authResponse = await fetch(`${BASE_URL}/api/auth/providers`);
      expect(authResponse.ok).toBe(true);

      const apiResponse = await fetch(`${BASE_URL}/api/settings/organization`, {
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      expect(apiResponse.status).toBe(401); // Expected without auth
    });

    it('should maintain CORS headers throughout workflow', async () => {
      const response = await fetch(`${BASE_URL}/api/settings/organization`, {
        method: 'OPTIONS',
        headers: {
          'Origin': BASE_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe(BASE_URL);
    });
  });
});

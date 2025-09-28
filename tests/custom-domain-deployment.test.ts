import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Custom Domain Deployment Test Suite
describe('Custom Domain Deployment Tests', () => {
  const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || 'smartstore-saas-demo.vercel.app';
  const BASE_URL = `https://${CUSTOM_DOMAIN}`;
  
  beforeAll(async () => {
    console.log(`🌐 Testing custom domain: ${BASE_URL}`);
  });

  afterAll(async () => {
    console.log('✅ Custom domain deployment tests completed');
  });

  describe('Domain Configuration', () => {
    it('should have valid custom domain', () => {
      expect(CUSTOM_DOMAIN).toBeDefined();
      expect(CUSTOM_DOMAIN).toMatch(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
    });

    it('should use HTTPS protocol', () => {
      expect(BASE_URL).toMatch(/^https:\/\//);
    });
  });

  describe('SSL Certificate', () => {
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

  describe('Security Headers', () => {
    it('should have security headers', async () => {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      const headers = response.headers;
      
      expect(headers.get('x-frame-options')).toBe('DENY');
      expect(headers.get('x-content-type-options')).toBe('nosniff');
      expect(headers.get('referrer-policy')).toBeDefined();
      expect(headers.get('strict-transport-security')).toContain('max-age=31536000');
    });

    it('should have Content Security Policy', async () => {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      const csp = response.headers.get('content-security-policy');
      
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
    });
  });

  describe('CORS Configuration', () => {
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
    });

    it('should handle preflight requests', async () => {
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
    });
  });

  describe('API Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.ok).toBe(true);
    });

    it('should handle organization API', async () => {
      const response = await fetch(`${BASE_URL}/api/settings/organization`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      // Should return 401 for unauthenticated request
      expect(response.status).toBe(401);
    });

    it('should handle products API', async () => {
      const response = await fetch(`${BASE_URL}/api/products`, {
        method: 'GET',
        headers: {
          'Origin': BASE_URL,
          'Content-Type': 'application/json'
        }
      });
      
      // Should return 401 for unauthenticated request
      expect(response.status).toBe(401);
    });
  });

  describe('Authentication', () => {
    it('should handle NextAuth configuration', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/providers`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it('should have correct NextAuth URL', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/session`);
      expect(response.ok).toBe(true);
    });
  });

  describe('Static Assets', () => {
    it('should serve static assets', async () => {
      const response = await fetch(`${BASE_URL}/favicon.ico`);
      expect(response.ok).toBe(true);
    });

    it('should serve images with correct headers', async () => {
      const response = await fetch(`${BASE_URL}/_next/static/media/next.8d01c5e3.png`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        expect(response.headers.get('content-type')).toMatch(/image\//);
      }
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time', async () => {
      const startTime = Date.now();
      const response = await fetch(BASE_URL);
      const endTime = Date.now();
      
      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should have proper caching headers', async () => {
      const response = await fetch(`${BASE_URL}/_next/static/css/app.css`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        expect(response.headers.get('cache-control')).toContain('max-age');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await fetch(`${BASE_URL}/non-existent-page`);
      expect(response.status).toBe(404);
    });

    it('should handle API errors gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });
  });

  describe('Database Integration', () => {
    it('should connect to database', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });
  });

  describe('Custom Domain Features', () => {
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
  });
});

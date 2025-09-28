


import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Import the modules to test
import { 
  getCorsHeaders, 
  handlePreflight, 
  applyCorsHeaders, 
  corsResponse, 
  isOriginAllowed, 
  getCorsOrigin 
} from '@/lib/cors';
import { 
  applySecurityHeaders, 
  secureResponse, 
  getSecurityHeaders, 
  validateOrigin 
} from '@/lib/security';

describe('CORS and Security Headers for Custom Domains', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('CORS Configuration', () => {
    it('should allow configured custom domains', () => {
      const customDomains = [
        'https://app.smartstore.com',
        'https://admin.smartstore.com',
        'https://smartstore.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ];

      customDomains.forEach(domain => {
        expect(isOriginAllowed(domain)).toBe(true);
      });
    });

    it('should reject unauthorized domains', () => {
      const unauthorizedDomains = [
        'https://malicious-site.com',
        'https://evil-domain.org',
        'https://phishing-site.net',
        'http://localhost:8080', // Different port
        'https://subdomain.unauthorized.com',
      ];

      unauthorizedDomains.forEach(domain => {
        expect(isOriginAllowed(domain)).toBe(false);
      });
    });

    it('should generate correct CORS headers for allowed origins', () => {
      const origin = 'https://app.smartstore.com';
      const headers = getCorsHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(headers['Access-Control-Allow-Methods']).toContain('DELETE');
      expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('should generate correct CORS headers for unauthorized origins', () => {
      const origin = 'https://unauthorized.com';
      const headers = getCorsHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should handle preflight requests correctly', () => {
      const response = handlePreflight();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should apply CORS headers to existing response', () => {
      const originalResponse = NextResponse.json({ message: 'test' });
      const origin = 'https://app.smartstore.com';
      
      const responseWithCors = applyCorsHeaders(originalResponse, origin);

      expect(responseWithCors.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      expect(responseWithCors.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should create CORS-enabled response', () => {
      const data = { message: 'test' };
      const origin = 'https://app.smartstore.com';
      const status = 201;
      
      const response = corsResponse(data, status, origin);

      expect(response.status).toBe(status);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    });

    it('should extract CORS origin from request', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://app.smartstore.com',
        },
      });

      const origin = getCorsOrigin(request);
      expect(origin).toBe('https://app.smartstore.com');
    });

    it('should return undefined for unauthorized origin', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://unauthorized.com',
        },
      });

      const origin = getCorsOrigin(request);
      expect(origin).toBeUndefined();
    });
  });

  describe('Security Headers', () => {
    it('should apply all required security headers', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(securedResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(securedResponse.headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
      expect(securedResponse.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });

    it('should create secure response with data', () => {
      const data = { message: 'test' };
      const status = 200;
      const additionalHeaders = { 'X-Custom-Header': 'value' };
      
      const response = secureResponse(data, status, additionalHeaders);

      expect(response.status).toBe(status);
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Custom-Header')).toBe('value');
    });

    it('should adjust security headers for different contexts', () => {
      const apiHeaders = getSecurityHeaders('api');
      const pageHeaders = getSecurityHeaders('page');
      const adminHeaders = getSecurityHeaders('admin');

      // All should have basic security headers
      expect(apiHeaders['X-Frame-Options']).toBe('DENY');
      expect(pageHeaders['X-Frame-Options']).toBe('DENY');
      expect(adminHeaders['X-Frame-Options']).toBe('DENY');

      // Admin context should have relaxed CSP
      expect(adminHeaders['Content-Security-Policy']).toContain("'unsafe-hashes'");
      expect(apiHeaders['Content-Security-Policy']).not.toContain("'unsafe-hashes'");
    });
  });

  describe('Origin Validation', () => {
    it('should validate same-origin requests', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://api.smartstore.com',
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should validate localhost for development', () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should validate allowed domains', () => {
      const allowedDomains = [
        'smartstore.com',
        'app.smartstore.com',
        'admin.smartstore.com',
        'api.smartstore.com',
      ];

      allowedDomains.forEach(domain => {
        const request = new NextRequest(`https://${domain}/test`, {
          headers: {
            'origin': `https://${domain}`,
            'host': domain,
          },
        });

        expect(validateOrigin(request)).toBe(true);
      });
    });

    it('should reject unauthorized domains', () => {
      const unauthorizedDomains = [
        'malicious-site.com',
        'phishing-domain.org',
        'evil-site.net',
      ];

      unauthorizedDomains.forEach(domain => {
        const request = new NextRequest(`https://api.smartstore.com/test`, {
          headers: {
            'origin': `https://${domain}`,
            'host': 'api.smartstore.com',
          },
        });

        expect(validateOrigin(request)).toBe(false);
      });
    });

    it('should handle requests without origin header', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should handle malformed origin URLs', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'not-a-valid-url',
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(false);
    });
  });

  describe('Custom Domain Integration', () => {
    it('should handle custom domain CORS with proper headers', () => {
      const customDomain = 'https://app.smartstore.com'; // Use allowed domain
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': customDomain,
        },
      });

      const origin = getCorsOrigin(request);
      const headers = getCorsHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe(customDomain);
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should validate custom domain origins', () => {
      const customDomain = 'https://mystore.smartstore.com';
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': customDomain,
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should reject non-smartstore custom domains', () => {
      const unauthorizedDomain = 'https://mystore.evilsite.com';
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': unauthorizedDomain,
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(false);
    });
  });

  describe('Security Headers for Custom Domains', () => {
    it('should apply strict CSP for custom domains', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      const csp = securedResponse.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it('should prevent clickjacking for custom domains', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should enforce HTTPS for custom domains', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      const hsts = securedResponse.headers.get('Strict-Transport-Security');
      expect(hsts).toContain('max-age=63072000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('should prevent MIME type sniffing', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should control referrer policy', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing origin header gracefully', () => {
      const headers = getCorsHeaders();
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com');
    });

    it('should handle empty origin header', () => {
      const headers = getCorsHeaders('');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com');
    });

    it('should handle null origin in request', () => {
      const request = new NextRequest('https://api.smartstore.com/test');
      const origin = getCorsOrigin(request);
      expect(origin).toBeUndefined();
    });

    it('should handle malformed host header', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://app.smartstore.com',
          'host': 'invalid-host-with-special-chars!@#$%',
        },
      });

      // The validateOrigin function should handle malformed hosts gracefully
      // and return false when URL parsing fails for host
      expect(validateOrigin(request)).toBe(false);
    });
  });
});
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('CORS Configuration', () => {
    it('should allow configured custom domains', () => {
      const customDomains = [
        'https://app.smartstore.com',
        'https://admin.smartstore.com',
        'https://smartstore.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ];

      customDomains.forEach(domain => {
        expect(isOriginAllowed(domain)).toBe(true);
      });
    });

    it('should reject unauthorized domains', () => {
      const unauthorizedDomains = [
        'https://malicious-site.com',
        'https://evil-domain.org',
        'https://phishing-site.net',
        'http://localhost:8080', // Different port
        'https://subdomain.unauthorized.com',
      ];

      unauthorizedDomains.forEach(domain => {
        expect(isOriginAllowed(domain)).toBe(false);
      });
    });

    it('should generate correct CORS headers for allowed origins', () => {
      const origin = 'https://app.smartstore.com';
      const headers = getCorsHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(headers['Access-Control-Allow-Methods']).toContain('DELETE');
      expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('should generate correct CORS headers for unauthorized origins', () => {
      const origin = 'https://unauthorized.com';
      const headers = getCorsHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should handle preflight requests correctly', () => {
      const response = handlePreflight();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should apply CORS headers to existing response', () => {
      const originalResponse = NextResponse.json({ message: 'test' });
      const origin = 'https://app.smartstore.com';
      
      const responseWithCors = applyCorsHeaders(originalResponse, origin);

      expect(responseWithCors.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      expect(responseWithCors.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should create CORS-enabled response', () => {
      const data = { message: 'test' };
      const origin = 'https://app.smartstore.com';
      const status = 201;
      
      const response = corsResponse(data, status, origin);

      expect(response.status).toBe(status);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    });

    it('should extract CORS origin from request', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://app.smartstore.com',
        },
      });

      const origin = getCorsOrigin(request);
      expect(origin).toBe('https://app.smartstore.com');
    });

    it('should return undefined for unauthorized origin', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://unauthorized.com',
        },
      });

      const origin = getCorsOrigin(request);
      expect(origin).toBeUndefined();
    });
  });

  describe('Security Headers', () => {
    it('should apply all required security headers', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(securedResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(securedResponse.headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
      expect(securedResponse.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });

    it('should create secure response with data', () => {
      const data = { message: 'test' };
      const status = 200;
      const additionalHeaders = { 'X-Custom-Header': 'value' };
      
      const response = secureResponse(data, status, additionalHeaders);

      expect(response.status).toBe(status);
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Custom-Header')).toBe('value');
    });

    it('should adjust security headers for different contexts', () => {
      const apiHeaders = getSecurityHeaders('api');
      const pageHeaders = getSecurityHeaders('page');
      const adminHeaders = getSecurityHeaders('admin');

      // All should have basic security headers
      expect(apiHeaders['X-Frame-Options']).toBe('DENY');
      expect(pageHeaders['X-Frame-Options']).toBe('DENY');
      expect(adminHeaders['X-Frame-Options']).toBe('DENY');

      // Admin context should have relaxed CSP
      expect(adminHeaders['Content-Security-Policy']).toContain("'unsafe-hashes'");
      expect(apiHeaders['Content-Security-Policy']).not.toContain("'unsafe-hashes'");
    });
  });

  describe('Origin Validation', () => {
    it('should validate same-origin requests', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://api.smartstore.com',
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should validate localhost for development', () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should validate allowed domains', () => {
      const allowedDomains = [
        'smartstore.com',
        'app.smartstore.com',
        'admin.smartstore.com',
        'api.smartstore.com',
      ];

      allowedDomains.forEach(domain => {
        const request = new NextRequest(`https://${domain}/test`, {
          headers: {
            'origin': `https://${domain}`,
            'host': domain,
          },
        });

        expect(validateOrigin(request)).toBe(true);
      });
    });

    it('should reject unauthorized domains', () => {
      const unauthorizedDomains = [
        'malicious-site.com',
        'phishing-domain.org',
        'evil-site.net',
      ];

      unauthorizedDomains.forEach(domain => {
        const request = new NextRequest(`https://api.smartstore.com/test`, {
          headers: {
            'origin': `https://${domain}`,
            'host': 'api.smartstore.com',
          },
        });

        expect(validateOrigin(request)).toBe(false);
      });
    });

    it('should handle requests without origin header', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should handle malformed origin URLs', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'not-a-valid-url',
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(false);
    });
  });

  describe('Custom Domain Integration', () => {
    it('should handle custom domain CORS with proper headers', () => {
      const customDomain = 'https://app.smartstore.com'; // Use allowed domain
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': customDomain,
        },
      });

      const origin = getCorsOrigin(request);
      const headers = getCorsHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe(customDomain);
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should validate custom domain origins', () => {
      const customDomain = 'https://mystore.smartstore.com';
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': customDomain,
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should reject non-smartstore custom domains', () => {
      const unauthorizedDomain = 'https://mystore.evilsite.com';
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': unauthorizedDomain,
          'host': 'api.smartstore.com',
        },
      });

      expect(validateOrigin(request)).toBe(false);
    });
  });

  describe('Security Headers for Custom Domains', () => {
    it('should apply strict CSP for custom domains', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      const csp = securedResponse.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it('should prevent clickjacking for custom domains', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should enforce HTTPS for custom domains', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      const hsts = securedResponse.headers.get('Strict-Transport-Security');
      expect(hsts).toContain('max-age=63072000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('should prevent MIME type sniffing', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should control referrer policy', () => {
      const response = NextResponse.json({ message: 'test' });
      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing origin header gracefully', () => {
      const headers = getCorsHeaders();
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com');
    });

    it('should handle empty origin header', () => {
      const headers = getCorsHeaders('');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com');
    });

    it('should handle null origin in request', () => {
      const request = new NextRequest('https://api.smartstore.com/test');
      const origin = getCorsOrigin(request);
      expect(origin).toBeUndefined();
    });

    it('should handle malformed host header', () => {
      const request = new NextRequest('https://api.smartstore.com/test', {
        headers: {
          'origin': 'https://app.smartstore.com',
          'host': 'invalid-host-with-special-chars!@#$%',
        },
      });

      // The validateOrigin function should handle malformed hosts gracefully
      // and return false when URL parsing fails for host
      expect(validateOrigin(request)).toBe(false);
    });
  });
});

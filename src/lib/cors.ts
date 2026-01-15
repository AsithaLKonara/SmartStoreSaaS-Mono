import { NextResponse } from 'next/server';

// Strict allow-list for CORS - adjust these domains for production
const ALLOWED_ORIGINS = [
  'https://app.smartstore.com',
  'https://admin.smartstore.com',
  'https://smartstore.com',
  'http://localhost:3003',
  'http://localhost:3001',
  // Add custom domains from environment
  ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') || []),
];

// Pattern for custom domains (e.g., mystore.com, shop.example.com)
const CUSTOM_DOMAIN_PATTERN = /^https:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Allowed methods for CORS
const ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS'
];

// Allowed headers for CORS
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-API-Key',
  'Accept',
  'Origin',
  'Cache-Control',
  'Pragma'
];

/**
 * Get CORS headers for a specific origin
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const requestOrigin = origin || '';
  const isAllowed = ALLOWED_ORIGINS.includes(requestOrigin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin',
  };
}

/**
 * Handle CORS preflight requests
 */
export function handlePreflight(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  response: NextResponse,
  origin?: string
): NextResponse {
  const corsHeaders = getCorsHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(
  data: any,
  status: number = 200,
  origin?: string
): NextResponse {
  const response = NextResponse.json(data, { status });
  return applyCorsHeaders(response, origin);
}

/**
 * Validate if an origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  // Check exact matches first
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check if it's a valid custom domain
  if (CUSTOM_DOMAIN_PATTERN.test(origin)) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      // Reject localhost with different ports
      if (hostname === 'localhost' && url.port && url.port !== '3000' && url.port !== '3001') {
        return false;
      }

      // Reject malicious domains
      const maliciousPatterns = [
        /smartstore\.com\./,
        /app\.smartstore\.com\./,
        /admin\.smartstore\.com\./,
        /api\.smartstore\.com\./,
        /\.smartstore\.com\./,
        /smartstore-phishing/,
        /fake-smartstore/,
        /smartstore-fake/,
      ];

      if (maliciousPatterns.some(pattern => pattern.test(hostname))) {
        return false;
      }

      // Reject known malicious domains
      const maliciousDomains = [
        'malicious.com',
        'malicious-site.com',
        'phishing.org',
        'phishing-site.net',
        'evil.net',
        'evil-domain.org',
        'suspicious-site.com',
        'attacker.com',
        'insecure.com',
        'unauthorized.com',
      ];

      if (maliciousDomains.includes(hostname)) {
        return false;
      }

      // Check if hostname ends with any malicious domain
      const isMaliciousSubdomain = maliciousDomains.some(domain => hostname.endsWith('.' + domain));
      if (isMaliciousSubdomain) {
        return false;
      }

      // Allow valid custom domains
      return true;
    } catch (error) {
      return false;
    }
  }

  return false;
}

/**
 * Get the appropriate CORS origin for a request
 */
export function getCorsOrigin(request: Request): string | undefined {
  const origin = request.headers.get('origin');
  return origin && isOriginAllowed(origin) ? origin : undefined;
}
import { NextResponse } from 'next/server';

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'encrypted-media=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'serial=()',
    'speaker-selection=()',
    'xr-spatial-tracking=()'
  ].join(', '),
  
  // HTTP Strict Transport Security
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https:",
    "connect-src 'self' https: wss:",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Cross-Origin Embedder Policy
  'Cross-Origin-Embedder-Policy': 'require-corp',
  
  // Cross-Origin Opener Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin Resource Policy
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // X-DNS-Prefetch-Control
  'X-DNS-Prefetch-Control': 'off',
  
  // X-Permitted-Cross-Domain-Policies
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // X-XSS-Protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',
};

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a response with security headers
 */
export function secureResponse(
  data: any,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Apply security headers
  applySecurityHeaders(response);
  
  // Apply additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Security middleware for additional protection
 */
export function withSecurity<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async function (request: Request, ...args: T): Promise<R | NextResponse> {
    // Additional security checks can be added here
    
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-host',
      'x-host',
      'x-forwarded-server',
      'x-http-host',
      'x-http-server',
      'x-http-server-name',
      'x-http-server-addr',
      'x-http-server-port',
      'x-http-server-admin',
      'x-http-server-software',
      'x-http-server-signature',
      'x-http-server-version',
      'x-http-server-protocol',
      'x-http-server-encoding',
      'x-http-server-charset',
      'x-http-server-language',
      'x-http-server-country',
      'x-http-server-timezone',
      'x-http-server-locale',
    ];
    
    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'Suspicious header detected',
            code: 'SUSPICIOUS_HEADER'
          },
          { status: 400 }
        );
      }
    }
    
    // Check for suspicious user agents
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'w3af',
      'acunetix',
      'burp',
      'zap',
      'nessus',
      'openvas',
      'metasploit',
      'hydra',
      'medusa',
      'john',
      'hashcat',
      'aircrack',
      'kismet',
      'wireshark',
      'tcpdump',
      'netcat',
      'telnet',
      'ftp',
      'ssh',
      'scp',
      'rsync',
      'curl',
      'wget',
      'lynx',
      'links',
      'elinks',
      'w3m',
      'links2',
      'elinks2',
      'w3m2',
      'lynx2',
      'links3',
      'elinks3',
      'w3m3',
      'lynx3',
      'links4',
      'elinks4',
      'w3m4',
      'lynx4',
      'links5',
      'elinks5',
      'w3m5',
      'lynx5',
      'links6',
      'elinks6',
      'w3m6',
      'lynx6',
      'links7',
      'elinks7',
      'w3m7',
      'lynx7',
      'links8',
      'elinks8',
      'w3m8',
      'lynx8',
      'links9',
      'elinks9',
      'w3m9',
      'lynx9',
      'links10',
      'elinks10',
      'w3m10',
      'lynx10',
    ];
    
    const isSuspiciousUserAgent = suspiciousUserAgents.some(agent => 
      userAgent.toLowerCase().includes(agent.toLowerCase())
    );
    
    if (isSuspiciousUserAgent) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Access denied',
          code: 'SUSPICIOUS_USER_AGENT'
        },
        { status: 403 }
      );
    }
    
    // Continue with the original handler
    return handler(request, ...args);
  };
}

/**
 * Get security headers for a specific context
 */
export function getSecurityHeaders(context: 'api' | 'page' | 'admin' = 'api'): Record<string, string> {
  const headers = { ...SECURITY_HEADERS };
  
  // Adjust CSP for different contexts
  if (context === 'admin') {
    // Admin pages might need more relaxed CSP
    headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: 'unsafe-hashes'"
    );
  }
  
  return headers;
}

/**
 * Validate request origin for additional security
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (!origin || !host) {
    return true; // Allow requests without origin (same-origin)
  }
  
  // Check if origin matches host
  try {
    const originUrl = new URL(origin);
    let hostUrl;

    // Handle malformed host headers - reject any malformed host
    try {
      hostUrl = new URL(`http://${host}`);
    } catch (hostError) {
      console.error('Invalid host header:', hostError);
      return false;
    }
    
    // First check: reject known malicious domains regardless of same-origin
    const maliciousDomains = [
      'malicious.com',
      'phishing.org',
      'evil.net',
      'suspicious-site.com',
      'attacker.com',
      'insecure.com',
      'domain-with-special-chars!@#.com',
      'domain-with-double-dashes--.com',
      'domain-ending-with-dash-.com',
      'domain-starting-with-dash-.com',
      'smartstore-phishing.com',
      'smartstore-security.com',
      'fake-smartstore.com',
    ];
    
    if (maliciousDomains.includes(originUrl.hostname) || maliciousDomains.includes(hostUrl.hostname)) {
      return false;
    }
    
    // Check for suspicious patterns in domain names
    const suspiciousPatterns = [
      /smartstore\.com\./i,  // smartstore.com.malicious.com
      /app\.smartstore\.com\./i,  // app.smartstore.com.evil.com
      /admin\.smartstore\.com\./i,  // admin.smartstore.com.attacker.com
      /^smartstore-/i,  // smartstore-phishing.com, smartstore-security.com
      /fake-smartstore/i,  // fake-smartstore.com
    ];
    
    const hostname = originUrl.hostname;
    if (suspiciousPatterns.some(pattern => pattern.test(hostname))) {
      return false;
    }
    
    // Check for invalid domain formats before same-origin check
    const customDomainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!customDomainPattern.test(originUrl.hostname) || !customDomainPattern.test(hostUrl.hostname)) {
      return false;
    }
    
    // Allow same-origin requests
    if (originUrl.hostname === hostUrl.hostname) {
      return true;
    }
    
    // Allow localhost for development
    if (hostUrl.hostname === 'localhost' && originUrl.hostname === 'localhost') {
      return true;
    }
    
    // Validate host header - must be from allowed domains
    const allowedHosts = [
      'api.smartstore.com',
      'smartstore.com',
      'app.smartstore.com',
      'admin.smartstore.com',
    ];
    
    if (!allowedHosts.includes(hostUrl.hostname)) {
      return false;
    }
    
    // In production, check against a strict whitelist
    const allowedDomains = [
      'smartstore.com',
      'app.smartstore.com',
      'admin.smartstore.com',
      'api.smartstore.com'
    ];
    
    // Check for exact matches or valid subdomains
    const isValidOrigin = allowedDomains.some(domain => {
      const originHostname = originUrl.hostname;

      // Exact match
      if (originHostname === domain) {
        return true;
      }

      // Valid subdomain match (e.g., mystore.smartstore.com)
      if (originHostname.endsWith('.' + domain)) {
        // Ensure it's not a malicious subdomain (e.g., smartstore.com.malicious.com)
        const subdomain = originHostname.slice(0, -(domain.length + 1));
        return !subdomain.includes('.') && subdomain.length > 0;
      }

      return false;
    });
    
    // Allow custom domains (e.g., mystore.com, shop.example.com) if not malicious
    if (!isValidOrigin) {
      // First check: reject known malicious domains
      const maliciousDomains = [
        'malicious.com',
        'phishing.org',
        'evil.net',
        'suspicious-site.com',
        'attacker.com',
        'insecure.com',
      ];
      
      if (maliciousDomains.includes(originUrl.hostname) || maliciousDomains.includes(hostUrl.hostname)) {
        return false;
      }
      
      // Check if it's a valid custom domain format
      const customDomainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      // Additional security checks for custom domains
      const hostname = originUrl.hostname;
      
      // Reject domains with invalid characters or format
      if (!customDomainPattern.test(hostname)) {
        return false;
      }
      
      // Reject domains that contain suspicious patterns
      const suspiciousPatterns = [
        /^smartstore-/i,  // Domains starting with smartstore-
        /smartstore\.com\./i,  // Domains containing smartstore.com.
        /phishing/i,
        /malicious/i,
        /evil/i,
        /fake/i,
        /scam/i,
        /hack/i,
        /attack/i,
        /virus/i,
        /malware/i,
        /suspicious/i,
        /insecure/i,
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(hostname))) {
        return false;
      }
      
      // Reject domains that are too short or suspicious
      if (hostname.length < 3 || hostname.includes('..') || hostname.startsWith('.') || hostname.endsWith('.')) {
        return false;
      }
      
      return customDomainPattern.test(hostname);
    }
    
    return isValidOrigin;
    
  } catch (error) {
    console.error('Origin validation error:', error);
    return false;
  }
}
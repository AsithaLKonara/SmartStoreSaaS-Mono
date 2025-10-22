import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers configuration
export const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel-insights.com",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: *.vercel-insights.com",
    "connect-src 'self' *.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'self'"
  ].join('; '),
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=(self)',
    'fullscreen=(self)',
    'picture-in-picture=()',
    'display-capture=()'
  ].join(', '),
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Strict Transport Security (HSTS) - only in production
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }),
  
  // Additional security headers
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Security middleware for API routes
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    return applySecurityHeaders(response);
  };
}

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://smart-store-saas-demo.vercel.app'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

// Apply CORS headers
export function applyCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// CSRF protection
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// SQL injection prevention
export function sanitizeSQL(input: string): string {
  return input
    .replace(/['"]/g, '')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '');
}

// XSS prevention
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// File upload security
export const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const maxFileSize = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!allowedFileTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  if (file.size > maxFileSize) {
    return { valid: false, error: 'File size too large' };
  }
  
  return { valid: true };
}

// Environment security check
export function validateEnvironment(): { secure: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for required environment variables
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      issues.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  // Check for weak secrets
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    issues.push('NEXTAUTH_SECRET should be at least 32 characters long');
  }
  
  // Check for development secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_SECRET === 'your-secret-key') {
      issues.push('Using default secret in production');
    }
  }
  
  return {
    secure: issues.length === 0,
    issues
  };
}

// Security audit logging
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    userAgent: details.userAgent || 'unknown',
    ip: details.ip || 'unknown',
    userId: details.userId || 'anonymous'
  };
  
  console.warn(`[SECURITY-${severity.toUpperCase()}] ${JSON.stringify(logEntry)}`);
  
  // In production, you might want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production' && severity === 'critical') {
    // Send to monitoring service
    console.error('CRITICAL SECURITY EVENT:', logEntry);
  }
}





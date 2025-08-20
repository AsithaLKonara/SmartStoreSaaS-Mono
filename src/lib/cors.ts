import { NextResponse } from 'next/server';

// Strict allow-list for CORS - adjust these domains for production
const ALLOWED_ORIGINS = [
  'https://app.smartstore.com',
  'https://admin.smartstore.com',
  'https://smartstore.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

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
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get the appropriate CORS origin for a request
 */
export function getCorsOrigin(request: Request): string | undefined {
  const origin = request.headers.get('origin');
  return origin && isOriginAllowed(origin) ? origin : undefined;
}

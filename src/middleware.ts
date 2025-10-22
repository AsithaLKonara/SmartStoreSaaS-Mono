import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './middleware/auth';
import { applySecurityHeaders, applyCorsHeaders } from './lib/security/headers';

export async function middleware(request: NextRequest) {
  // Apply authentication middleware first
  const authResponse = await authMiddleware(request);
  
  // If auth middleware returns a redirect or error, return it
  if (authResponse.status !== 200) {
    return authResponse;
  }
  
  // Add comprehensive security headers to successful responses
  let response = authResponse;
  
  // Apply security headers
  response = applySecurityHeaders(response);
  
  // Apply CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response = applyCorsHeaders(response);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|unauthorized).*)',
  ],
};

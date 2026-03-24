import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './middleware/auth';
import { applySecurityHeaders, applyCorsHeaders } from './lib/security/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that must bypass all middleware filters (including CORS and security)
  const bypassPaths = [
    '/api/auth', 
    '/api/auth-debug', 
    '/_next', 
    '/favicon.ico',
    '/videos',
    '/images',
    '/icons',
    '/fonts'
  ];
  if (bypassPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // 1. Extract hostname and handle subdomain routing
  const host = request.headers.get('host') || '';
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000';
  
  // Clean hostname for comparison
  const hostname = host.replace(`.${domain}`, '').split(':')[0];
  
  // Apply authentication middleware first
  const authResponse = await authMiddleware(request);
  
  // If auth middleware returns a redirect or error, return it
  if (authResponse.status !== 200) {
    return authResponse;
  }

  // 2. Routing Logic (Rewrites)
  let response = authResponse;
  
  // Handle root domain / localhost:3000
  if (host === domain || host === `www.${domain}` || host === 'localhost:3000') {
    // Marketing Site (or Root)
    // If it's the root path or starts with marketing routes, rewrite to (marketing)
    if (pathname === '/' || pathname === '/pricing' || pathname === '/features') {
      return NextResponse.rewrite(new URL(`/(marketing)${pathname}`, request.url));
    }
    // Shared marketplace always accessible via /marketplace on root
    if (pathname.startsWith('/marketplace')) {
       return NextResponse.rewrite(new URL(`/(marketplace)${pathname}`, request.url));
    }
  } else if (hostname === 'admin') {
    return NextResponse.rewrite(new URL(`/(admin)${pathname}`, request.url));
  } else if (hostname === 'app') {
    return NextResponse.rewrite(new URL(`/(dashboard)${pathname}`, request.url));
  } else if (hostname === 'pos') {
    return NextResponse.rewrite(new URL(`/(pos-app)${pathname}`, request.url));
  } else if (hostname && hostname !== domain) {
    // Tenant Storefront (Subdomains like nike.smartstore.com)
    return NextResponse.rewrite(new URL(`/(storefront)${pathname}`, request.url));
  }

  // Add comprehensive security headers to successful responses
  // Apply security headers
  response = applySecurityHeaders(response);

  // Apply CORS headers for API routes (excluding auth which we bypassed above)
  if (pathname.startsWith('/api/')) {
    response = applyCorsHeaders(response);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

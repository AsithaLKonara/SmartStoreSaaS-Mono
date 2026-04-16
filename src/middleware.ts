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
  
  let domain = process.env.NEXT_PUBLIC_DOMAIN || '';
  let hostname = '';

  if (!domain) {
    if (host.includes('localhost')) {
      domain = 'localhost';
      const baseHost = host.split(':')[0] || 'localhost';
      hostname = baseHost === 'localhost' ? '' : baseHost.replace('.localhost', '');
    } else {
      // Production TLD+1 detection (e.g. app.tenant.smartstore.com -> domain: smartstore.com, hostname: app.tenant)
      const parts = (host.split(':')[0] || '').split('.');
      if (parts.length > 2) {
        domain = parts.slice(-2).join('.');
        hostname = parts.slice(0, -2).join('.');
      } else {
        domain = parts.join('.');
        hostname = '';
      }
    }
  } else {
    // If NEXT_PUBLIC_DOMAIN is provided as 'smartstore.com'
    hostname = host.replace(`.${domain}`, '').split(':')[0] || '';
    if (hostname === (host.split(':')[0] || '')) hostname = ''; // No subdomain found
  }
  
  // Apply authentication middleware first
  const authResponse = await authMiddleware(request);
  
  // If auth middleware returns a redirect or error, return it
  if (authResponse.status !== 200) {
    return authResponse;
  }

  // 2. Routing Logic (Rewrites)
  let response = authResponse;
  
  // Root domain check: hostname is empty or 'www'
  const isRootDomain = !hostname || hostname === 'www' || host.startsWith('127.0.0.1');

  // Debug routing (Internal logs)
  // console.log(`[Middleware] Host: ${host}, Domain: ${domain}, Hostname: ${hostname}, isRoot: ${isRootDomain}`);
  if (isRootDomain) {
    // Marketing Site (or Root)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/marketing-home', request.url));
    }
    
    // Auth and marketing pages
    const publicMarketingPaths = ['/pricing', '/features', '/about', '/contact', '/login', '/register'];
    if (publicMarketingPaths.some(path => pathname === path)) {
      return NextResponse.rewrite(new URL(pathname, request.url));
    }

    // Marketplace is now a standard route at /marketplace
  } else if (hostname === 'admin') {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin-home', request.url));
    }
    // Transparent rewrite - Next.js will find the route in whatever group it resides
    return NextResponse.rewrite(new URL(pathname, request.url));
  } else if (hostname === 'app') {
    // Redirect app.localhost/ to app.localhost/dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.rewrite(new URL(pathname, request.url));
  } else if (hostname === 'pos') {
    return NextResponse.rewrite(new URL(pathname, request.url));
  } else if (hostname && hostname !== domain) {
    // Tenant Storefront (Subdomains like nike.smartstore.com)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/store-home', request.url));
    }
    return NextResponse.rewrite(new URL(pathname, request.url));
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

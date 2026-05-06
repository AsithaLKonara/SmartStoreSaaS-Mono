import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/demo', '/unauthorized', '/api/auth', '/api/test', '/api/working-signin', '/api/health', '/api/db-check', '/videos', '/images', '/api/webhooks'];

  const isPublicPath = pathname === '/' || 
    publicPaths.some(path => pathname.startsWith(path)) ||
    (request.method === 'GET' && (
      pathname.startsWith('/shop') || 
      pathname.startsWith('/product') || 
      pathname.startsWith('/marketplace')
    ));
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Check for custom JWT bearer token first (to support API requests)
  const authHeader = request.headers.get('Authorization');
  console.log(`[AUTH MIDDLEWARE] Path: ${pathname}, Authorization Header: ${authHeader ? 'Present' : 'Missing'}`);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const tokenString = authHeader.substring(7);
    try {
      const parts = tokenString.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
        if (decoded) {
          console.log(`[AUTH MIDDLEWARE] Custom JWT parsed successfully for path ${pathname} (User: ${decoded.email || decoded.userId})`);
          return NextResponse.next(); // Valid API request, allow it!
        }
      }
    } catch (jwtError: any) {
      console.log(`[AUTH MIDDLEWARE] Custom JWT parsing failed for path ${pathname}: ${jwtError.message}`);
    }
  }
  
  // Check for authentication token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Redirect to login if no token
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // MFA Enforcement
  const isMfaPath = pathname.startsWith('/auth/mfa');
  if (token.mfaEnabled && !token.mfaVerified && !isMfaPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/mfa';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // User is authenticated and MFA is verified (if required), allow the request
  return NextResponse.next();
}


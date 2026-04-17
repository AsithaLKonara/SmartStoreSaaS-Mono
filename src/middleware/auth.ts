import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/demo', '/unauthorized', '/api/auth', '/api/health', '/api/db-check', '/videos', '/images'];

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


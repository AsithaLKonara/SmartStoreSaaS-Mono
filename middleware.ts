import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected route patterns - adjust as needed
const PROTECTED_ROUTES = [
  /^\/api\/(orders|customers|payments|admin|analytics|integrations|security|chat)/,
  /^\/api\/products/,
  /^\/api\/search/,
  /^\/admin/,
  /^\/dashboard/,
];

// Public routes that should always be accessible
const PUBLIC_ROUTES = [
  /^\/api\/health/,
  /^\/api\/auth\/(signin|signup|callback)/,
  /^\/$/,
  /^\/favicon\.ico$/,
  /^\/_next\//,
  /^\/api\/webhooks\//,
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }
  
  // Check if route is protected
  if (PROTECTED_ROUTES.some(pattern => pattern.test(pathname))) {
    try {
      // Get token from cookies (NextAuth session)
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (!token) {
        // No valid session - return 401 Unauthorized
        return NextResponse.json(
          { 
            error: 'Unauthorized', 
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }, 
          { status: 401 }
        );
      }
      
      // Check if user has required permissions for admin routes
      if (pathname.startsWith('/admin') || pathname.includes('/api/admin')) {
        const userRole = token.role || token.user?.role;
        const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
        
        if (!userRole || !allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { 
              error: 'Forbidden', 
              message: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS'
            }, 
            { status: 403 }
          );
        }
      }
      
      // Valid authentication - proceed
      return NextResponse.next();
      
    } catch (error) {
      console.error('Middleware authentication error:', error);
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Authentication service unavailable',
          code: 'AUTH_SERVICE_ERROR'
        }, 
        { status: 500 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

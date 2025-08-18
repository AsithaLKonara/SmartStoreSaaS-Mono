import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication Middleware
 * Protects API routes and injects user context
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: 'Authorization token required' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as JWTPayload;

      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return NextResponse.json(
          { success: false, message: 'Token expired' },
          { status: 401 }
        );
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, organizationId: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { success: false, message: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Inject user context into request
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || '',
      };

      // Call the original handler
      return await handler(req);

    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        );
      }

      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { success: false, message: 'Token expired' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Role-based Access Control Middleware
 * Restricts access based on user roles
 */
export function withRole(requiredRoles: string[]) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user has required role
      if (!requiredRoles.includes(req.user.role)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Access denied. Required roles: ${requiredRoles.join(', ')}` 
          },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Organization Isolation Middleware
 * Ensures users can only access their organization's data
 */
export function withOrganizationAccess(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user?.organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization access required' },
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

/**
 * Rate Limiting Middleware (Basic Implementation)
 * Limits requests per IP address
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (req: AuthenticatedRequest) => {
      const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
      const now = Date.now();
      
      // Get current rate limit data for this IP
      const rateLimit = rateLimitMap.get(ip);
      
      if (rateLimit && now < rateLimit.resetTime) {
        // Within rate limit window
        if (rateLimit.count >= maxRequests) {
          return NextResponse.json(
            { success: false, message: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        // New rate limit window
        rateLimitMap.set(ip, {
          count: 1,
          resetTime: now + windowMs
        });
      }

      return await handler(req);
    };
  };
}

/**
 * Combined Middleware for Protected Routes
 * Combines authentication, role checking, and rate limiting
 */
export function withProtection(
  requiredRoles: string[] = [],
  maxRequests: number = 100
) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    let protectedHandler = handler;
    
    // Apply rate limiting
    protectedHandler = withRateLimit(maxRequests)(protectedHandler);
    
    // Apply organization access control
    protectedHandler = withOrganizationAccess(protectedHandler);
    
    // Apply role-based access control if roles specified
    if (requiredRoles.length > 0) {
      protectedHandler = withRole(requiredRoles)(protectedHandler);
    } else {
      // Just apply authentication
      protectedHandler = withAuth(protectedHandler);
    }
    
    return protectedHandler;
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, secureResponse } from './security';
import { AdvancedSecurityService } from './security/advancedSecurityService';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from './auth-middleware';
import { logger } from '@/lib/logger';

const securityService = new AdvancedSecurityService();

export interface EnhancedAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  permissions?: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface EnhancedAuthRequest extends NextRequest {
  user?: EnhancedAuthUser;
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      region: string;
      city: string;
      coordinates?: [number, number];
    };
    riskScore?: number;
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface SecurityMiddlewareOptions {
  requiredRole?: typeof ROLES[keyof typeof ROLES];
  requiredPermissions?: typeof PERMISSIONS[keyof typeof PERMISSIONS][];
  requireAllPermissions?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: EnhancedAuthRequest) => string;
  };
  threatDetection?: boolean;
  auditLog?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  customSecurityChecks?: ((req: EnhancedAuthRequest) => Promise<boolean>)[];
}

/**
 * Enhanced security middleware with comprehensive threat detection
 */
export function withEnhancedSecurity<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    const {
      requiredRole,
      requiredPermissions = [],
      requireAllPermissions = false,
      requireAuth = true,
      rateLimit,
      threatDetection = true,
      auditLog = true,
      ipWhitelist = [],
      ipBlacklist = [],
      customSecurityChecks = []
    } = options;

    const startTime = Date.now();
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    try {
      // Create enhanced request object
      const enhancedRequest = request as EnhancedAuthRequest;
      
      // Initialize security context
      enhancedRequest.securityContext = {
        ipAddress,
        userAgent,
        deviceFingerprint: await generateDeviceFingerprint(request),
        location: await getLocationFromIP(ipAddress),
        riskScore: 0,
        threatLevel: 'low'
      };

      // IP-based security checks
      if (ipBlacklist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP blacklisted' },
          severity: 'high',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_BLOCKED' },
          403
        );
      }

      if (ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP not whitelisted' },
          severity: 'medium',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_NOT_WHITELISTED' },
          403
        );
      }

      // Rate limiting
      if (rateLimit) {
        const key = rateLimit.keyGenerator ? rateLimit.keyGenerator(enhancedRequest) : ipAddress;
        const isRateLimited = await checkRateLimit(key, rateLimit.maxRequests, rateLimit.windowMs);
        
        if (isRateLimited) {
          await logSecurityEvent({
            type: 'rate_limit_exceeded',
            ipAddress,
            userAgent,
            details: { key, maxRequests: rateLimit.maxRequests, windowMs: rateLimit.windowMs },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            429
          );
        }
      }

      // Threat detection
      if (threatDetection) {
        const threatAnalysis = await analyzeThreat(enhancedRequest);
        enhancedRequest.securityContext.riskScore = threatAnalysis.riskScore;
        enhancedRequest.securityContext.threatLevel = threatAnalysis.threatLevel;

        if (threatAnalysis.isBlocked) {
          await logSecurityEvent({
            type: 'blocked_request',
            ipAddress,
            userAgent,
            details: { 
              reason: threatAnalysis.reason,
              riskScore: threatAnalysis.riskScore,
              actions: threatAnalysis.actions
            },
            severity: threatAnalysis.threatLevel === 'critical' ? 'critical' : 'high',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Access denied', code: 'THREAT_DETECTED' },
            403
          );
        }
      }

      // Authentication
      let user: EnhancedAuthUser | null = null;
      
      if (requireAuth) {
        user = await authenticateUser(request);
        if (!user) {
          await logSecurityEvent({
            type: 'authentication_failed',
            ipAddress,
            userAgent,
            details: { reason: 'No valid authentication token' },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            401
          );
        }

        enhancedRequest.user = user;

        // Role-based access control
        if (requiredRole && !hasRole(user.role, requiredRole)) {
          await logSecurityEvent({
            type: 'access_denied',
            userId: user.id,
            ipAddress,
            userAgent,
            details: { 
              reason: 'Insufficient role',
              userRole: user.role,
              requiredRole
            },
            severity: 'medium',
            timestamp: new Date(),
            organizationId: user.organizationId
          });
          return secureResponse(
            { error: 'Insufficient permissions', code: 'INSUFFICIENT_ROLE' },
            403
          );
        }

        // Permission-based access control
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requireAllPermissions
            ? hasAllPermissions(user.role, requiredPermissions)
            : hasAnyPermission(user.role, requiredPermissions);

          if (!hasRequiredPermissions) {
            await logSecurityEvent({
              type: 'access_denied',
              userId: user.id,
              ipAddress,
              userAgent,
              details: { 
                reason: 'Insufficient permissions',
                userRole: user.role,
                requiredPermissions,
                requireAllPermissions
              },
              severity: 'medium',
              timestamp: new Date(),
              organizationId: user.organizationId
            });
            return secureResponse(
              { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
              403
            );
          }
        }
      }

      // Custom security checks
      for (const check of customSecurityChecks) {
        const passed = await check(enhancedRequest);
        if (!passed) {
          await logSecurityEvent({
            type: 'custom_security_check_failed',
            userId: user?.id,
            ipAddress,
            userAgent,
            details: { reason: 'Custom security check failed' },
            severity: 'high',
            timestamp: new Date(),
            organizationId: user?.organizationId
          });
          return secureResponse(
            { error: 'Security check failed', code: 'CUSTOM_SECURITY_FAILED' },
            403
          );
        }
      }

      // Execute the handler
      const response = await handler(enhancedRequest, ...args);

      // Audit logging
      if (auditLog) {
        await logSecurityEvent({
          type: 'api_access',
          userId: user?.id,
          ipAddress,
          userAgent,
          details: { 
            method: request.method,
            url: request.url,
            statusCode: response.status,
            responseTime: Date.now() - startTime,
            riskScore: enhancedRequest.securityContext?.riskScore || 0
          },
          severity: enhancedRequest.securityContext?.riskScore > 50 ? 'medium' : 'low',
          timestamp: new Date(),
          organizationId: user?.organizationId
        });
      }

      // Apply security headers
      return applySecurityHeaders(response);

    } catch (error) {
      logger.error({
        message: 'Enhanced security middleware error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'EnhancedSecurityMiddleware', operation: 'middleware', path: request.nextUrl.pathname }
      });
      
      await logSecurityEvent({
        type: 'security_middleware_error',
        ipAddress,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        timestamp: new Date()
      });

      return secureResponse(
        { error: 'Internal security error', code: 'SECURITY_ERROR' },
        500
      );
    }
  };
}

/**
 * Authenticate user with enhanced security checks
 */
async function authenticateUser(request: NextRequest): Promise<EnhancedAuthUser | null> {
  try {
    // Try NextAuth token first
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return {
        id: token.sub!,
        email: token.email!,
        name: token.name || '',
        role: token.role as string,
        organizationId: token.organizationId as string,
        lastLogin: token.lastLogin ? new Date(token.lastLogin as string) : undefined,
        isActive: true
      };
    }

    // Try custom JWT token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const customToken = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(customToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        return {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || '',
          role: decoded.role,
          organizationId: decoded.organizationId,
          lastLogin: decoded.lastLogin ? new Date(decoded.lastLogin) : undefined,
          isActive: decoded.isActive !== false
        };
      } catch (jwtError) {
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Authentication error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'authenticateRequest' }
    });
    return null;
  }
}

/**
 * Analyze threat level for the request
 */
async function analyzeThreat(request: EnhancedAuthRequest) {
  const securityEvent = {
    type: 'api_access' as const,
    ipAddress: request.securityContext!.ipAddress,
    userAgent: request.securityContext!.userAgent,
    userId: request.user?.id,
    details: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    severity: 'low' as const,
    timestamp: new Date(),
    organizationId: request.user?.organizationId
  };

  return await securityService.analyzeThreat(securityEvent);
}

/**
 * Log security event
 */
async function logSecurityEvent(event: any) {
  try {
    await securityService.logSecurityEvent(event);
  } catch (error) {
    logger.error({
      message: 'Failed to log security event',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'logSecurityEvent' }
    });
  }
}

/**
 * Check rate limit for a key
 */
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  // Implementation would use Redis or similar for distributed rate limiting
  // For now, return false (not rate limited)
  return false;
}

/**
 * Generate device fingerprint
 */
async function generateDeviceFingerprint(request: NextRequest): Promise<string> {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return require('crypto').createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Get location from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  // Implementation would use a geolocation service
  // For now, return null
  return null;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

/**
 * Create enhanced auth handler for API routes
 */
export function createEnhancedAuthHandler<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return withEnhancedSecurity(handler, options);
}

import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, secureResponse } from './security';
import { AdvancedSecurityService } from './security/advancedSecurityService';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from './auth-middleware';

const securityService = new AdvancedSecurityService();

export interface EnhancedAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  permissions?: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface EnhancedAuthRequest extends NextRequest {
  user?: EnhancedAuthUser;
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      region: string;
      city: string;
      coordinates?: [number, number];
    };
    riskScore?: number;
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface SecurityMiddlewareOptions {
  requiredRole?: typeof ROLES[keyof typeof ROLES];
  requiredPermissions?: typeof PERMISSIONS[keyof typeof PERMISSIONS][];
  requireAllPermissions?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: EnhancedAuthRequest) => string;
  };
  threatDetection?: boolean;
  auditLog?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  customSecurityChecks?: ((req: EnhancedAuthRequest) => Promise<boolean>)[];
}

/**
 * Enhanced security middleware with comprehensive threat detection
 */
export function withEnhancedSecurity<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    const {
      requiredRole,
      requiredPermissions = [],
      requireAllPermissions = false,
      requireAuth = true,
      rateLimit,
      threatDetection = true,
      auditLog = true,
      ipWhitelist = [],
      ipBlacklist = [],
      customSecurityChecks = []
    } = options;

    const startTime = Date.now();
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    try {
      // Create enhanced request object
      const enhancedRequest = request as EnhancedAuthRequest;
      
      // Initialize security context
      enhancedRequest.securityContext = {
        ipAddress,
        userAgent,
        deviceFingerprint: await generateDeviceFingerprint(request),
        location: await getLocationFromIP(ipAddress),
        riskScore: 0,
        threatLevel: 'low'
      };

      // IP-based security checks
      if (ipBlacklist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP blacklisted' },
          severity: 'high',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_BLOCKED' },
          403
        );
      }

      if (ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP not whitelisted' },
          severity: 'medium',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_NOT_WHITELISTED' },
          403
        );
      }

      // Rate limiting
      if (rateLimit) {
        const key = rateLimit.keyGenerator ? rateLimit.keyGenerator(enhancedRequest) : ipAddress;
        const isRateLimited = await checkRateLimit(key, rateLimit.maxRequests, rateLimit.windowMs);
        
        if (isRateLimited) {
          await logSecurityEvent({
            type: 'rate_limit_exceeded',
            ipAddress,
            userAgent,
            details: { key, maxRequests: rateLimit.maxRequests, windowMs: rateLimit.windowMs },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            429
          );
        }
      }

      // Threat detection
      if (threatDetection) {
        const threatAnalysis = await analyzeThreat(enhancedRequest);
        enhancedRequest.securityContext.riskScore = threatAnalysis.riskScore;
        enhancedRequest.securityContext.threatLevel = threatAnalysis.threatLevel;

        if (threatAnalysis.isBlocked) {
          await logSecurityEvent({
            type: 'blocked_request',
            ipAddress,
            userAgent,
            details: { 
              reason: threatAnalysis.reason,
              riskScore: threatAnalysis.riskScore,
              actions: threatAnalysis.actions
            },
            severity: threatAnalysis.threatLevel === 'critical' ? 'critical' : 'high',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Access denied', code: 'THREAT_DETECTED' },
            403
          );
        }
      }

      // Authentication
      let user: EnhancedAuthUser | null = null;
      
      if (requireAuth) {
        user = await authenticateUser(request);
        if (!user) {
          await logSecurityEvent({
            type: 'authentication_failed',
            ipAddress,
            userAgent,
            details: { reason: 'No valid authentication token' },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            401
          );
        }

        enhancedRequest.user = user;

        // Role-based access control
        if (requiredRole && !hasRole(user.role, requiredRole)) {
          await logSecurityEvent({
            type: 'access_denied',
            userId: user.id,
            ipAddress,
            userAgent,
            details: { 
              reason: 'Insufficient role',
              userRole: user.role,
              requiredRole
            },
            severity: 'medium',
            timestamp: new Date(),
            organizationId: user.organizationId
          });
          return secureResponse(
            { error: 'Insufficient permissions', code: 'INSUFFICIENT_ROLE' },
            403
          );
        }

        // Permission-based access control
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requireAllPermissions
            ? hasAllPermissions(user.role, requiredPermissions)
            : hasAnyPermission(user.role, requiredPermissions);

          if (!hasRequiredPermissions) {
            await logSecurityEvent({
              type: 'access_denied',
              userId: user.id,
              ipAddress,
              userAgent,
              details: { 
                reason: 'Insufficient permissions',
                userRole: user.role,
                requiredPermissions,
                requireAllPermissions
              },
              severity: 'medium',
              timestamp: new Date(),
              organizationId: user.organizationId
            });
            return secureResponse(
              { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
              403
            );
          }
        }
      }

      // Custom security checks
      for (const check of customSecurityChecks) {
        const passed = await check(enhancedRequest);
        if (!passed) {
          await logSecurityEvent({
            type: 'custom_security_check_failed',
            userId: user?.id,
            ipAddress,
            userAgent,
            details: { reason: 'Custom security check failed' },
            severity: 'high',
            timestamp: new Date(),
            organizationId: user?.organizationId
          });
          return secureResponse(
            { error: 'Security check failed', code: 'CUSTOM_SECURITY_FAILED' },
            403
          );
        }
      }

      // Execute the handler
      const response = await handler(enhancedRequest, ...args);

      // Audit logging
      if (auditLog) {
        await logSecurityEvent({
          type: 'api_access',
          userId: user?.id,
          ipAddress,
          userAgent,
          details: { 
            method: request.method,
            url: request.url,
            statusCode: response.status,
            responseTime: Date.now() - startTime,
            riskScore: enhancedRequest.securityContext?.riskScore || 0
          },
          severity: enhancedRequest.securityContext?.riskScore > 50 ? 'medium' : 'low',
          timestamp: new Date(),
          organizationId: user?.organizationId
        });
      }

      // Apply security headers
      return applySecurityHeaders(response);

    } catch (error) {
      logger.error({
        message: 'Enhanced security middleware error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'EnhancedSecurityMiddleware', operation: 'middleware', path: request.nextUrl.pathname }
      });
      
      await logSecurityEvent({
        type: 'security_middleware_error',
        ipAddress,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        timestamp: new Date()
      });

      return secureResponse(
        { error: 'Internal security error', code: 'SECURITY_ERROR' },
        500
      );
    }
  };
}

/**
 * Authenticate user with enhanced security checks
 */
async function authenticateUser(request: NextRequest): Promise<EnhancedAuthUser | null> {
  try {
    // Try NextAuth token first
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return {
        id: token.sub!,
        email: token.email!,
        name: token.name || '',
        role: token.role as string,
        organizationId: token.organizationId as string,
        lastLogin: token.lastLogin ? new Date(token.lastLogin as string) : undefined,
        isActive: true
      };
    }

    // Try custom JWT token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const customToken = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(customToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        return {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || '',
          role: decoded.role,
          organizationId: decoded.organizationId,
          lastLogin: decoded.lastLogin ? new Date(decoded.lastLogin) : undefined,
          isActive: decoded.isActive !== false
        };
      } catch (jwtError) {
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Authentication error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'authenticateRequest' }
    });
    return null;
  }
}

/**
 * Analyze threat level for the request
 */
async function analyzeThreat(request: EnhancedAuthRequest) {
  const securityEvent = {
    type: 'api_access' as const,
    ipAddress: request.securityContext!.ipAddress,
    userAgent: request.securityContext!.userAgent,
    userId: request.user?.id,
    details: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    severity: 'low' as const,
    timestamp: new Date(),
    organizationId: request.user?.organizationId
  };

  return await securityService.analyzeThreat(securityEvent);
}

/**
 * Log security event
 */
async function logSecurityEvent(event: any) {
  try {
    await securityService.logSecurityEvent(event);
  } catch (error) {
    logger.error({
      message: 'Failed to log security event',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'logSecurityEvent' }
    });
  }
}

/**
 * Check rate limit for a key
 */
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  // Implementation would use Redis or similar for distributed rate limiting
  // For now, return false (not rate limited)
  return false;
}

/**
 * Generate device fingerprint
 */
async function generateDeviceFingerprint(request: NextRequest): Promise<string> {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return require('crypto').createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Get location from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  // Implementation would use a geolocation service
  // For now, return null
  return null;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

/**
 * Create enhanced auth handler for API routes
 */
export function createEnhancedAuthHandler<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return withEnhancedSecurity(handler, options);
}

import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, secureResponse } from './security';
import { AdvancedSecurityService } from './security/advancedSecurityService';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from './auth-middleware';

const securityService = new AdvancedSecurityService();

export interface EnhancedAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  permissions?: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface EnhancedAuthRequest extends NextRequest {
  user?: EnhancedAuthUser;
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      region: string;
      city: string;
      coordinates?: [number, number];
    };
    riskScore?: number;
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface SecurityMiddlewareOptions {
  requiredRole?: typeof ROLES[keyof typeof ROLES];
  requiredPermissions?: typeof PERMISSIONS[keyof typeof PERMISSIONS][];
  requireAllPermissions?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: EnhancedAuthRequest) => string;
  };
  threatDetection?: boolean;
  auditLog?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  customSecurityChecks?: ((req: EnhancedAuthRequest) => Promise<boolean>)[];
}

/**
 * Enhanced security middleware with comprehensive threat detection
 */
export function withEnhancedSecurity<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    const {
      requiredRole,
      requiredPermissions = [],
      requireAllPermissions = false,
      requireAuth = true,
      rateLimit,
      threatDetection = true,
      auditLog = true,
      ipWhitelist = [],
      ipBlacklist = [],
      customSecurityChecks = []
    } = options;

    const startTime = Date.now();
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    try {
      // Create enhanced request object
      const enhancedRequest = request as EnhancedAuthRequest;
      
      // Initialize security context
      enhancedRequest.securityContext = {
        ipAddress,
        userAgent,
        deviceFingerprint: await generateDeviceFingerprint(request),
        location: await getLocationFromIP(ipAddress),
        riskScore: 0,
        threatLevel: 'low'
      };

      // IP-based security checks
      if (ipBlacklist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP blacklisted' },
          severity: 'high',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_BLOCKED' },
          403
        );
      }

      if (ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP not whitelisted' },
          severity: 'medium',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_NOT_WHITELISTED' },
          403
        );
      }

      // Rate limiting
      if (rateLimit) {
        const key = rateLimit.keyGenerator ? rateLimit.keyGenerator(enhancedRequest) : ipAddress;
        const isRateLimited = await checkRateLimit(key, rateLimit.maxRequests, rateLimit.windowMs);
        
        if (isRateLimited) {
          await logSecurityEvent({
            type: 'rate_limit_exceeded',
            ipAddress,
            userAgent,
            details: { key, maxRequests: rateLimit.maxRequests, windowMs: rateLimit.windowMs },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            429
          );
        }
      }

      // Threat detection
      if (threatDetection) {
        const threatAnalysis = await analyzeThreat(enhancedRequest);
        enhancedRequest.securityContext.riskScore = threatAnalysis.riskScore;
        enhancedRequest.securityContext.threatLevel = threatAnalysis.threatLevel;

        if (threatAnalysis.isBlocked) {
          await logSecurityEvent({
            type: 'blocked_request',
            ipAddress,
            userAgent,
            details: { 
              reason: threatAnalysis.reason,
              riskScore: threatAnalysis.riskScore,
              actions: threatAnalysis.actions
            },
            severity: threatAnalysis.threatLevel === 'critical' ? 'critical' : 'high',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Access denied', code: 'THREAT_DETECTED' },
            403
          );
        }
      }

      // Authentication
      let user: EnhancedAuthUser | null = null;
      
      if (requireAuth) {
        user = await authenticateUser(request);
        if (!user) {
          await logSecurityEvent({
            type: 'authentication_failed',
            ipAddress,
            userAgent,
            details: { reason: 'No valid authentication token' },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            401
          );
        }

        enhancedRequest.user = user;

        // Role-based access control
        if (requiredRole && !hasRole(user.role, requiredRole)) {
          await logSecurityEvent({
            type: 'access_denied',
            userId: user.id,
            ipAddress,
            userAgent,
            details: { 
              reason: 'Insufficient role',
              userRole: user.role,
              requiredRole
            },
            severity: 'medium',
            timestamp: new Date(),
            organizationId: user.organizationId
          });
          return secureResponse(
            { error: 'Insufficient permissions', code: 'INSUFFICIENT_ROLE' },
            403
          );
        }

        // Permission-based access control
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requireAllPermissions
            ? hasAllPermissions(user.role, requiredPermissions)
            : hasAnyPermission(user.role, requiredPermissions);

          if (!hasRequiredPermissions) {
            await logSecurityEvent({
              type: 'access_denied',
              userId: user.id,
              ipAddress,
              userAgent,
              details: { 
                reason: 'Insufficient permissions',
                userRole: user.role,
                requiredPermissions,
                requireAllPermissions
              },
              severity: 'medium',
              timestamp: new Date(),
              organizationId: user.organizationId
            });
            return secureResponse(
              { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
              403
            );
          }
        }
      }

      // Custom security checks
      for (const check of customSecurityChecks) {
        const passed = await check(enhancedRequest);
        if (!passed) {
          await logSecurityEvent({
            type: 'custom_security_check_failed',
            userId: user?.id,
            ipAddress,
            userAgent,
            details: { reason: 'Custom security check failed' },
            severity: 'high',
            timestamp: new Date(),
            organizationId: user?.organizationId
          });
          return secureResponse(
            { error: 'Security check failed', code: 'CUSTOM_SECURITY_FAILED' },
            403
          );
        }
      }

      // Execute the handler
      const response = await handler(enhancedRequest, ...args);

      // Audit logging
      if (auditLog) {
        await logSecurityEvent({
          type: 'api_access',
          userId: user?.id,
          ipAddress,
          userAgent,
          details: { 
            method: request.method,
            url: request.url,
            statusCode: response.status,
            responseTime: Date.now() - startTime,
            riskScore: enhancedRequest.securityContext?.riskScore || 0
          },
          severity: enhancedRequest.securityContext?.riskScore > 50 ? 'medium' : 'low',
          timestamp: new Date(),
          organizationId: user?.organizationId
        });
      }

      // Apply security headers
      return applySecurityHeaders(response);

    } catch (error) {
      logger.error({
        message: 'Enhanced security middleware error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'EnhancedSecurityMiddleware', operation: 'middleware', path: request.nextUrl.pathname }
      });
      
      await logSecurityEvent({
        type: 'security_middleware_error',
        ipAddress,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        timestamp: new Date()
      });

      return secureResponse(
        { error: 'Internal security error', code: 'SECURITY_ERROR' },
        500
      );
    }
  };
}

/**
 * Authenticate user with enhanced security checks
 */
async function authenticateUser(request: NextRequest): Promise<EnhancedAuthUser | null> {
  try {
    // Try NextAuth token first
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return {
        id: token.sub!,
        email: token.email!,
        name: token.name || '',
        role: token.role as string,
        organizationId: token.organizationId as string,
        lastLogin: token.lastLogin ? new Date(token.lastLogin as string) : undefined,
        isActive: true
      };
    }

    // Try custom JWT token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const customToken = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(customToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        return {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || '',
          role: decoded.role,
          organizationId: decoded.organizationId,
          lastLogin: decoded.lastLogin ? new Date(decoded.lastLogin) : undefined,
          isActive: decoded.isActive !== false
        };
      } catch (jwtError) {
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Authentication error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'authenticateRequest' }
    });
    return null;
  }
}

/**
 * Analyze threat level for the request
 */
async function analyzeThreat(request: EnhancedAuthRequest) {
  const securityEvent = {
    type: 'api_access' as const,
    ipAddress: request.securityContext!.ipAddress,
    userAgent: request.securityContext!.userAgent,
    userId: request.user?.id,
    details: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    severity: 'low' as const,
    timestamp: new Date(),
    organizationId: request.user?.organizationId
  };

  return await securityService.analyzeThreat(securityEvent);
}

/**
 * Log security event
 */
async function logSecurityEvent(event: any) {
  try {
    await securityService.logSecurityEvent(event);
  } catch (error) {
    logger.error({
      message: 'Failed to log security event',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'logSecurityEvent' }
    });
  }
}

/**
 * Check rate limit for a key
 */
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  // Implementation would use Redis or similar for distributed rate limiting
  // For now, return false (not rate limited)
  return false;
}

/**
 * Generate device fingerprint
 */
async function generateDeviceFingerprint(request: NextRequest): Promise<string> {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return require('crypto').createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Get location from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  // Implementation would use a geolocation service
  // For now, return null
  return null;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

/**
 * Create enhanced auth handler for API routes
 */
export function createEnhancedAuthHandler<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return withEnhancedSecurity(handler, options);
}

import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, secureResponse } from './security';
import { AdvancedSecurityService } from './security/advancedSecurityService';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from './auth-middleware';

const securityService = new AdvancedSecurityService();

export interface EnhancedAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  permissions?: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface EnhancedAuthRequest extends NextRequest {
  user?: EnhancedAuthUser;
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      region: string;
      city: string;
      coordinates?: [number, number];
    };
    riskScore?: number;
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface SecurityMiddlewareOptions {
  requiredRole?: typeof ROLES[keyof typeof ROLES];
  requiredPermissions?: typeof PERMISSIONS[keyof typeof PERMISSIONS][];
  requireAllPermissions?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: EnhancedAuthRequest) => string;
  };
  threatDetection?: boolean;
  auditLog?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  customSecurityChecks?: ((req: EnhancedAuthRequest) => Promise<boolean>)[];
}

/**
 * Enhanced security middleware with comprehensive threat detection
 */
export function withEnhancedSecurity<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    const {
      requiredRole,
      requiredPermissions = [],
      requireAllPermissions = false,
      requireAuth = true,
      rateLimit,
      threatDetection = true,
      auditLog = true,
      ipWhitelist = [],
      ipBlacklist = [],
      customSecurityChecks = []
    } = options;

    const startTime = Date.now();
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    try {
      // Create enhanced request object
      const enhancedRequest = request as EnhancedAuthRequest;
      
      // Initialize security context
      enhancedRequest.securityContext = {
        ipAddress,
        userAgent,
        deviceFingerprint: await generateDeviceFingerprint(request),
        location: await getLocationFromIP(ipAddress),
        riskScore: 0,
        threatLevel: 'low'
      };

      // IP-based security checks
      if (ipBlacklist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP blacklisted' },
          severity: 'high',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_BLOCKED' },
          403
        );
      }

      if (ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP not whitelisted' },
          severity: 'medium',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_NOT_WHITELISTED' },
          403
        );
      }

      // Rate limiting
      if (rateLimit) {
        const key = rateLimit.keyGenerator ? rateLimit.keyGenerator(enhancedRequest) : ipAddress;
        const isRateLimited = await checkRateLimit(key, rateLimit.maxRequests, rateLimit.windowMs);
        
        if (isRateLimited) {
          await logSecurityEvent({
            type: 'rate_limit_exceeded',
            ipAddress,
            userAgent,
            details: { key, maxRequests: rateLimit.maxRequests, windowMs: rateLimit.windowMs },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            429
          );
        }
      }

      // Threat detection
      if (threatDetection) {
        const threatAnalysis = await analyzeThreat(enhancedRequest);
        enhancedRequest.securityContext.riskScore = threatAnalysis.riskScore;
        enhancedRequest.securityContext.threatLevel = threatAnalysis.threatLevel;

        if (threatAnalysis.isBlocked) {
          await logSecurityEvent({
            type: 'blocked_request',
            ipAddress,
            userAgent,
            details: { 
              reason: threatAnalysis.reason,
              riskScore: threatAnalysis.riskScore,
              actions: threatAnalysis.actions
            },
            severity: threatAnalysis.threatLevel === 'critical' ? 'critical' : 'high',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Access denied', code: 'THREAT_DETECTED' },
            403
          );
        }
      }

      // Authentication
      let user: EnhancedAuthUser | null = null;
      
      if (requireAuth) {
        user = await authenticateUser(request);
        if (!user) {
          await logSecurityEvent({
            type: 'authentication_failed',
            ipAddress,
            userAgent,
            details: { reason: 'No valid authentication token' },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            401
          );
        }

        enhancedRequest.user = user;

        // Role-based access control
        if (requiredRole && !hasRole(user.role, requiredRole)) {
          await logSecurityEvent({
            type: 'access_denied',
            userId: user.id,
            ipAddress,
            userAgent,
            details: { 
              reason: 'Insufficient role',
              userRole: user.role,
              requiredRole
            },
            severity: 'medium',
            timestamp: new Date(),
            organizationId: user.organizationId
          });
          return secureResponse(
            { error: 'Insufficient permissions', code: 'INSUFFICIENT_ROLE' },
            403
          );
        }

        // Permission-based access control
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requireAllPermissions
            ? hasAllPermissions(user.role, requiredPermissions)
            : hasAnyPermission(user.role, requiredPermissions);

          if (!hasRequiredPermissions) {
            await logSecurityEvent({
              type: 'access_denied',
              userId: user.id,
              ipAddress,
              userAgent,
              details: { 
                reason: 'Insufficient permissions',
                userRole: user.role,
                requiredPermissions,
                requireAllPermissions
              },
              severity: 'medium',
              timestamp: new Date(),
              organizationId: user.organizationId
            });
            return secureResponse(
              { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
              403
            );
          }
        }
      }

      // Custom security checks
      for (const check of customSecurityChecks) {
        const passed = await check(enhancedRequest);
        if (!passed) {
          await logSecurityEvent({
            type: 'custom_security_check_failed',
            userId: user?.id,
            ipAddress,
            userAgent,
            details: { reason: 'Custom security check failed' },
            severity: 'high',
            timestamp: new Date(),
            organizationId: user?.organizationId
          });
          return secureResponse(
            { error: 'Security check failed', code: 'CUSTOM_SECURITY_FAILED' },
            403
          );
        }
      }

      // Execute the handler
      const response = await handler(enhancedRequest, ...args);

      // Audit logging
      if (auditLog) {
        await logSecurityEvent({
          type: 'api_access',
          userId: user?.id,
          ipAddress,
          userAgent,
          details: { 
            method: request.method,
            url: request.url,
            statusCode: response.status,
            responseTime: Date.now() - startTime,
            riskScore: enhancedRequest.securityContext?.riskScore || 0
          },
          severity: enhancedRequest.securityContext?.riskScore > 50 ? 'medium' : 'low',
          timestamp: new Date(),
          organizationId: user?.organizationId
        });
      }

      // Apply security headers
      return applySecurityHeaders(response);

    } catch (error) {
      logger.error({
        message: 'Enhanced security middleware error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'EnhancedSecurityMiddleware', operation: 'middleware', path: request.nextUrl.pathname }
      });
      
      await logSecurityEvent({
        type: 'security_middleware_error',
        ipAddress,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        timestamp: new Date()
      });

      return secureResponse(
        { error: 'Internal security error', code: 'SECURITY_ERROR' },
        500
      );
    }
  };
}

/**
 * Authenticate user with enhanced security checks
 */
async function authenticateUser(request: NextRequest): Promise<EnhancedAuthUser | null> {
  try {
    // Try NextAuth token first
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return {
        id: token.sub!,
        email: token.email!,
        name: token.name || '',
        role: token.role as string,
        organizationId: token.organizationId as string,
        lastLogin: token.lastLogin ? new Date(token.lastLogin as string) : undefined,
        isActive: true
      };
    }

    // Try custom JWT token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const customToken = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(customToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        return {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || '',
          role: decoded.role,
          organizationId: decoded.organizationId,
          lastLogin: decoded.lastLogin ? new Date(decoded.lastLogin) : undefined,
          isActive: decoded.isActive !== false
        };
      } catch (jwtError) {
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Authentication error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'authenticateRequest' }
    });
    return null;
  }
}

/**
 * Analyze threat level for the request
 */
async function analyzeThreat(request: EnhancedAuthRequest) {
  const securityEvent = {
    type: 'api_access' as const,
    ipAddress: request.securityContext!.ipAddress,
    userAgent: request.securityContext!.userAgent,
    userId: request.user?.id,
    details: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    severity: 'low' as const,
    timestamp: new Date(),
    organizationId: request.user?.organizationId
  };

  return await securityService.analyzeThreat(securityEvent);
}

/**
 * Log security event
 */
async function logSecurityEvent(event: any) {
  try {
    await securityService.logSecurityEvent(event);
  } catch (error) {
    logger.error({
      message: 'Failed to log security event',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'logSecurityEvent' }
    });
  }
}

/**
 * Check rate limit for a key
 */
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  // Implementation would use Redis or similar for distributed rate limiting
  // For now, return false (not rate limited)
  return false;
}

/**
 * Generate device fingerprint
 */
async function generateDeviceFingerprint(request: NextRequest): Promise<string> {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return require('crypto').createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Get location from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  // Implementation would use a geolocation service
  // For now, return null
  return null;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

/**
 * Create enhanced auth handler for API routes
 */
export function createEnhancedAuthHandler<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return withEnhancedSecurity(handler, options);
}

import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, secureResponse } from './security';
import { AdvancedSecurityService } from './security/advancedSecurityService';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from './auth-middleware';

const securityService = new AdvancedSecurityService();

export interface EnhancedAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  permissions?: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface EnhancedAuthRequest extends NextRequest {
  user?: EnhancedAuthUser;
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      region: string;
      city: string;
      coordinates?: [number, number];
    };
    riskScore?: number;
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface SecurityMiddlewareOptions {
  requiredRole?: typeof ROLES[keyof typeof ROLES];
  requiredPermissions?: typeof PERMISSIONS[keyof typeof PERMISSIONS][];
  requireAllPermissions?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: EnhancedAuthRequest) => string;
  };
  threatDetection?: boolean;
  auditLog?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  customSecurityChecks?: ((req: EnhancedAuthRequest) => Promise<boolean>)[];
}

/**
 * Enhanced security middleware with comprehensive threat detection
 */
export function withEnhancedSecurity<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    const {
      requiredRole,
      requiredPermissions = [],
      requireAllPermissions = false,
      requireAuth = true,
      rateLimit,
      threatDetection = true,
      auditLog = true,
      ipWhitelist = [],
      ipBlacklist = [],
      customSecurityChecks = []
    } = options;

    const startTime = Date.now();
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    try {
      // Create enhanced request object
      const enhancedRequest = request as EnhancedAuthRequest;
      
      // Initialize security context
      enhancedRequest.securityContext = {
        ipAddress,
        userAgent,
        deviceFingerprint: await generateDeviceFingerprint(request),
        location: await getLocationFromIP(ipAddress),
        riskScore: 0,
        threatLevel: 'low'
      };

      // IP-based security checks
      if (ipBlacklist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP blacklisted' },
          severity: 'high',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_BLOCKED' },
          403
        );
      }

      if (ipWhitelist.length > 0 && !ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent({
          type: 'blocked_request',
          ipAddress,
          userAgent,
          details: { reason: 'IP not whitelisted' },
          severity: 'medium',
          timestamp: new Date()
        });
        return secureResponse(
          { error: 'Access denied', code: 'IP_NOT_WHITELISTED' },
          403
        );
      }

      // Rate limiting
      if (rateLimit) {
        const key = rateLimit.keyGenerator ? rateLimit.keyGenerator(enhancedRequest) : ipAddress;
        const isRateLimited = await checkRateLimit(key, rateLimit.maxRequests, rateLimit.windowMs);
        
        if (isRateLimited) {
          await logSecurityEvent({
            type: 'rate_limit_exceeded',
            ipAddress,
            userAgent,
            details: { key, maxRequests: rateLimit.maxRequests, windowMs: rateLimit.windowMs },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            429
          );
        }
      }

      // Threat detection
      if (threatDetection) {
        const threatAnalysis = await analyzeThreat(enhancedRequest);
        enhancedRequest.securityContext.riskScore = threatAnalysis.riskScore;
        enhancedRequest.securityContext.threatLevel = threatAnalysis.threatLevel;

        if (threatAnalysis.isBlocked) {
          await logSecurityEvent({
            type: 'blocked_request',
            ipAddress,
            userAgent,
            details: { 
              reason: threatAnalysis.reason,
              riskScore: threatAnalysis.riskScore,
              actions: threatAnalysis.actions
            },
            severity: threatAnalysis.threatLevel === 'critical' ? 'critical' : 'high',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Access denied', code: 'THREAT_DETECTED' },
            403
          );
        }
      }

      // Authentication
      let user: EnhancedAuthUser | null = null;
      
      if (requireAuth) {
        user = await authenticateUser(request);
        if (!user) {
          await logSecurityEvent({
            type: 'authentication_failed',
            ipAddress,
            userAgent,
            details: { reason: 'No valid authentication token' },
            severity: 'medium',
            timestamp: new Date()
          });
          return secureResponse(
            { error: 'Authentication required', code: 'AUTH_REQUIRED' },
            401
          );
        }

        enhancedRequest.user = user;

        // Role-based access control
        if (requiredRole && !hasRole(user.role, requiredRole)) {
          await logSecurityEvent({
            type: 'access_denied',
            userId: user.id,
            ipAddress,
            userAgent,
            details: { 
              reason: 'Insufficient role',
              userRole: user.role,
              requiredRole
            },
            severity: 'medium',
            timestamp: new Date(),
            organizationId: user.organizationId
          });
          return secureResponse(
            { error: 'Insufficient permissions', code: 'INSUFFICIENT_ROLE' },
            403
          );
        }

        // Permission-based access control
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requireAllPermissions
            ? hasAllPermissions(user.role, requiredPermissions)
            : hasAnyPermission(user.role, requiredPermissions);

          if (!hasRequiredPermissions) {
            await logSecurityEvent({
              type: 'access_denied',
              userId: user.id,
              ipAddress,
              userAgent,
              details: { 
                reason: 'Insufficient permissions',
                userRole: user.role,
                requiredPermissions,
                requireAllPermissions
              },
              severity: 'medium',
              timestamp: new Date(),
              organizationId: user.organizationId
            });
            return secureResponse(
              { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
              403
            );
          }
        }
      }

      // Custom security checks
      for (const check of customSecurityChecks) {
        const passed = await check(enhancedRequest);
        if (!passed) {
          await logSecurityEvent({
            type: 'custom_security_check_failed',
            userId: user?.id,
            ipAddress,
            userAgent,
            details: { reason: 'Custom security check failed' },
            severity: 'high',
            timestamp: new Date(),
            organizationId: user?.organizationId
          });
          return secureResponse(
            { error: 'Security check failed', code: 'CUSTOM_SECURITY_FAILED' },
            403
          );
        }
      }

      // Execute the handler
      const response = await handler(enhancedRequest, ...args);

      // Audit logging
      if (auditLog) {
        await logSecurityEvent({
          type: 'api_access',
          userId: user?.id,
          ipAddress,
          userAgent,
          details: { 
            method: request.method,
            url: request.url,
            statusCode: response.status,
            responseTime: Date.now() - startTime,
            riskScore: enhancedRequest.securityContext?.riskScore || 0
          },
          severity: enhancedRequest.securityContext?.riskScore > 50 ? 'medium' : 'low',
          timestamp: new Date(),
          organizationId: user?.organizationId
        });
      }

      // Apply security headers
      return applySecurityHeaders(response);

    } catch (error) {
      logger.error({
        message: 'Enhanced security middleware error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'EnhancedSecurityMiddleware', operation: 'middleware', path: request.nextUrl.pathname }
      });
      
      await logSecurityEvent({
        type: 'security_middleware_error',
        ipAddress,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        timestamp: new Date()
      });

      return secureResponse(
        { error: 'Internal security error', code: 'SECURITY_ERROR' },
        500
      );
    }
  };
}

/**
 * Authenticate user with enhanced security checks
 */
async function authenticateUser(request: NextRequest): Promise<EnhancedAuthUser | null> {
  try {
    // Try NextAuth token first
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return {
        id: token.sub!,
        email: token.email!,
        name: token.name || '',
        role: token.role as string,
        organizationId: token.organizationId as string,
        lastLogin: token.lastLogin ? new Date(token.lastLogin as string) : undefined,
        isActive: true
      };
    }

    // Try custom JWT token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const customToken = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(customToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        return {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || '',
          role: decoded.role,
          organizationId: decoded.organizationId,
          lastLogin: decoded.lastLogin ? new Date(decoded.lastLogin) : undefined,
          isActive: decoded.isActive !== false
        };
      } catch (jwtError) {
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Authentication error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'authenticateRequest' }
    });
    return null;
  }
}

/**
 * Analyze threat level for the request
 */
async function analyzeThreat(request: EnhancedAuthRequest) {
  const securityEvent = {
    type: 'api_access' as const,
    ipAddress: request.securityContext!.ipAddress,
    userAgent: request.securityContext!.userAgent,
    userId: request.user?.id,
    details: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    severity: 'low' as const,
    timestamp: new Date(),
    organizationId: request.user?.organizationId
  };

  return await securityService.analyzeThreat(securityEvent);
}

/**
 * Log security event
 */
async function logSecurityEvent(event: any) {
  try {
    await securityService.logSecurityEvent(event);
  } catch (error) {
    logger.error({
      message: 'Failed to log security event',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'EnhancedSecurityMiddleware', operation: 'logSecurityEvent' }
    });
  }
}

/**
 * Check rate limit for a key
 */
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  // Implementation would use Redis or similar for distributed rate limiting
  // For now, return false (not rate limited)
  return false;
}

/**
 * Generate device fingerprint
 */
async function generateDeviceFingerprint(request: NextRequest): Promise<string> {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return require('crypto').createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Get location from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  // Implementation would use a geolocation service
  // For now, return null
  return null;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

/**
 * Create enhanced auth handler for API routes
 */
export function createEnhancedAuthHandler<T extends any[]>(
  handler: (req: EnhancedAuthRequest, ...args: T) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return withEnhancedSecurity(handler, options);
}


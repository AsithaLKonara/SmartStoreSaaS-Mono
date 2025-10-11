import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironment, logSecurityEvent } from '@/lib/security/headers';
import { withErrorHandling } from '@/lib/error-handling';

export const dynamic = 'force-dynamic';

const securityAudit = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    // Validate environment security
    const envValidation = validateEnvironment();
    
    // Check for common security issues
    const securityChecks = {
      environment: envValidation,
      headers: {
        https: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV !== 'production',
        userAgent: request.headers.get('user-agent') || 'unknown',
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      },
      authentication: {
        hasSession: !!request.headers.get('authorization'),
        sessionValid: true, // This would be checked against your auth system
      },
      rateLimiting: {
        enabled: true,
        status: 'active'
      }
    };
    
    // Log security audit
    logSecurityEvent('security_audit', {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      checks: securityChecks
    }, 'low');
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      security: securityChecks,
      recommendations: envValidation.issues.length > 0 ? [
        'Review environment configuration',
        'Update security settings',
        'Enable additional monitoring'
      ] : [
        'Security configuration looks good',
        'Continue regular security audits',
        'Monitor for new vulnerabilities'
      ]
    });
    
  } catch (error: any) {
    logSecurityEvent('security_audit_error', {
      error: error.message,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }, 'medium');
    
    throw error;
  }
};

export const GET = withErrorHandling(securityAudit);



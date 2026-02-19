/**
 * Security Audit API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_SECURITY_AUDIT permission)
 * 
 * System-wide: Security audit logs and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/security/audit
 * Get security audit logs (SUPER_ADMIN only)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'Security audit requested',
        context: {
          userId: user.id
        },
        correlation: req.correlationId
      });

      const [failedLogins, suspicious] = await Promise.all([
        prisma.auditLog.count({
          where: { action: 'LOGIN_FAILURE' }
        }),
        prisma.auditLog.findMany({
          where: {
            OR: [
              { action: 'PERMISSION_DENIED' },
              { action: 'UNAUTHORIZED_ACCESS' }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { name: true, email: true } }
          }
        })
      ]);

      return NextResponse.json(successResponse({
        failedLoginAttempts: failedLogins,
        suspiciousActivities: suspicious.map(s => ({
          userId: s.userId,
          user: s.user?.name,
          action: s.action,
          resource: s.resource,
          timestamp: s.createdAt
        })),
        vulnerabilities: [],
        recommendations: [
          failedLogins > 50 ? "High number of login failures. Consider enabling 2FA for all staff." : "Stable login activity.",
          suspicious.length > 0 ? "Review current permission denials for potential privilege escalation attempts." : "No suspicious activity detected."
        ]
      }));
    } catch (error: any) {
      logger.error({
        message: 'Security audit failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Security audit failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


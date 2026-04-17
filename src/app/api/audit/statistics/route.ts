/**
 * Audit Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AUDIT_LOGS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/audit/statistics
 * Get audit statistics with organization scoping
 */
export const GET = requirePermission(Permission.AUDIT_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      // Get organization scoping (SUPER_ADMIN can see all)
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Audit statistics requested',
        context: {
          userId: user.id,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      // Calculate actual statistics from audit log table
      const whereClause = orgId ? { organizationId: orgId } : {};
      
      const [totalLogs, actionGroups, userGroups, recentActivity] = await Promise.all([
        prisma.auditLog.count({ where: whereClause }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          where: whereClause
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { userId: true },
          where: whereClause,
          orderBy: { _count: { userId: 'desc' } },
          take: 5
        }),
        prisma.auditLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { firstName: true, lastName: true, email: true } } }
        })
      ]);

      const byAction = actionGroups.reduce((acc, curr) => ({
        ...acc,
        [curr.action]: curr._count.action
      }), {} as Record<string, number>);

      const byUser = userGroups.reduce((acc, curr) => ({
        ...acc,
        [curr.userId]: curr._count.userId
      }), {} as Record<string, number>);

      return NextResponse.json(successResponse({
        totalLogs,
        byAction,
        byUser,
        recentActivity
      }));
    } catch (error: any) {
      logger.error({
        message: 'Audit statistics failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Audit statistics failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * Audit Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (VIEW_AUDIT_LOGS permission)
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
 * POST /api/audit/export
 * Export audit logs with organization scoping
 */
export const POST = requirePermission(Permission.AUDIT_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { startDate, endDate, format = 'csv' } = body;

      // Get organization scoping
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Audit log export requested',
        context: {
          userId: user.id,
          organizationId: orgId,
          format,
          startDate,
          endDate
        },
        correlation: req.correlationId
      });

      const logs = await prisma.auditLog.findMany({
        where: {
          ...(orgId && { organizationId: orgId }),
          ...(startDate && { createdAt: { gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { lte: new Date(endDate) } }),
        },
        orderBy: { createdAt: 'desc' },
      });

      let exportData = '';
      if (format === 'csv') {
        const header = ['ID', 'User ID', 'Action', 'Resource', 'Resource ID', 'Date'].join(',');
        const rows = logs.map(l => [
            l.id, l.userId, l.action, l.resource, l.resourceId || '', l.createdAt.toISOString()
        ].map(col => `"${String(col).replace(/"/g, '""')}"`).join(','));
        exportData = [header, ...rows].join('\n');
      } else {
        exportData = JSON.stringify(logs, null, 2);
      }

      return NextResponse.json(successResponse({
        format,
        data: exportData,
        recordCount: logs.length,
        message: 'Export completed'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Audit log export failed',
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
        message: 'Audit log export failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

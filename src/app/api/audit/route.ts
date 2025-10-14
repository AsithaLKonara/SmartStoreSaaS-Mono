/**
 * Audit API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AUDIT_LOGS permission)
 * 
 * Organization Scoping: Required (SUPER_ADMIN sees all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const orgId = getOrganizationScope(user);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: orgId ? { organizationId: orgId } : {},
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.auditLog.count({
          where: orgId ? { organizationId: orgId } : {}
        })
      ]);

      logger.info({
        message: 'Audit logs fetched',
        context: { userId: user.id, count: logs.length }
      });

      return NextResponse.json(successResponse(logs, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch audit logs',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

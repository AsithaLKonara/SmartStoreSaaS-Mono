/**
 * Audit Logs API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_AUDIT_LOGS permission)
 * 
 * Organization Scoping: Optional (SUPER_ADMIN can query all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { getAuditLogs, AuditAction, AuditResource } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');

      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const filters: any = {
        organizationId,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
      };

      if (searchParams.get('userId')) {
        filters.userId = searchParams.get('userId');
      }
      if (searchParams.get('action')) {
        filters.action = searchParams.get('action') as AuditAction;
      }
      if (searchParams.get('resource')) {
        filters.resource = searchParams.get('resource') as AuditResource;
      }
      if (searchParams.get('startDate')) {
        filters.startDate = new Date(searchParams.get('startDate')!);
      }
      if (searchParams.get('endDate')) {
        filters.endDate = new Date(searchParams.get('endDate')!);
      }

      const { logs, total } = await getAuditLogs(filters);

      logger.info({
        message: 'Audit logs fetched',
        context: {
          userId: user.id,
          role: user.role,
          organizationId,
          count: logs.length
        }
      });

      return NextResponse.json(
        successResponse(logs, {
          total,
          limit: filters.limit,
          offset: filters.offset
        })
      );
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

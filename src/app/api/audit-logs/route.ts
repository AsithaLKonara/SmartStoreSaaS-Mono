/**
 * Audit Logs API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_AUDIT_LOGS permission)
 * 
 * Organization Scoping: Optional (SUPER_ADMIN can query all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/audit-logs
 * Get audit logs (SUPER_ADMIN only, can query all organizations)
 */
export const GET = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const organizationId = searchParams.get('organizationId');

      // SUPER_ADMIN can query specific organization or all
      if (!organizationId) {
        throw new ValidationError('Organization ID is required', {
          fields: { organizationId: !organizationId }
        });
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
        filters.action = searchParams.get('action');
      }
      if (searchParams.get('resource')) {
        filters.resource = searchParams.get('resource');
      }
      if (searchParams.get('startDate')) {
        filters.startDate = new Date(searchParams.get('startDate')!);
      }
      if (searchParams.get('endDate')) {
        filters.endDate = new Date(searchParams.get('endDate')!);
      }

      // TODO: Implement audit logs query when audit_log table is available
      const logs: any[] = [];
      const total = 0;

      logger.info({
        message: 'Audit logs fetched',
        context: {
          userId: user.id,
          organizationId,
          count: logs.length
        },
        correlation: req.correlationId
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
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch audit logs',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

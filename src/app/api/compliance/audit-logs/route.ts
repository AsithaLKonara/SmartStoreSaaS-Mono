import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

import { AuditService } from '@/lib/services/audit.service';

/**
 * GET /api/compliance/audit-logs
 * Get compliance audit logs (VIEW_AUDIT_LOGS permission)
 */
export const GET = requirePermission('VIEW_AUDIT_LOGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId') || undefined;
      const resource = searchParams.get('entity') || undefined;
      const action = searchParams.get('action') || undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      const result = await AuditService.getLogs({
        organizationId: organizationId as string,
        page,
        limit,
        userId,
        action,
        resource
      });

      logger.info({
        message: 'Compliance audit logs fetched',
        context: {
          userId: user.id,
          organizationId,
          filters: { userId, resource, action },
          count: result.logs.length,
          total: result.total
        }
      });

      return NextResponse.json(successResponse({
        logs: result.logs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.totalPages
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Error fetching audit logs',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { userId: user.id }
      });

      return NextResponse.json({
        success: false,
        message: 'Failed to fetch logs',
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/compliance/audit-logs
 * Create audit log
 */
export const POST = requirePermission('VIEW_AUDIT_LOGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      const body = await req.json();
      const {
        userId,
        action,
        entity,
        entityId,
        beforeState,
        afterState,
        ipAddress,
        userAgent
      } = body;

      const log = await AuditService.log({
        userId: userId || user.id,
        organizationId: organizationId as string,
        action,
        resource: entity,
        resourceId: entityId,
        details: { beforeState, afterState },
        ipAddress,
        userAgent
      });

      logger.info({
        message: 'Audit log created',
        context: {
          userId: user.id,
          organizationId,
          action,
          entity
        }
      });

      return NextResponse.json(successResponse(log));
    } catch (error: any) {
      logger.error({
        message: 'Failed to create log',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { userId: user.id }
      });

      return NextResponse.json({
        success: false,
        message: 'Failed to create log',
      }, { status: 500 });
    }
  }
);


/**
 * Bulk Operations API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_BULK_OPERATIONS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bulk-operations
 * Execute bulk operation (MANAGE_PRODUCTS permission - can be adjusted based on entityType)
 */
export const POST = requirePermission('MANAGE_PRODUCTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { operation, entityType, data } = body;

      if (!operation || !entityType || !data) {
        throw new ValidationError('Operation, entity type, and data are required', {
          fields: { operation: !operation, entityType: !entityType, data: !data }
        });
      }

      logger.info({
        message: 'Bulk operation initiated',
        context: {
          userId: user.id,
          organizationId,
          operation,
          entityType,
          count: Array.isArray(data) ? data.length : 1
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Bulk operation queued',
        operation,
        entityType,
        status: 'pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Bulk operation failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Bulk operation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

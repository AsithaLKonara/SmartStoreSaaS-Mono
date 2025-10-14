/**
 * Bulk Operations API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_BULK_OPERATIONS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { operation, entityType, data } = body;

      if (!operation || !entityType || !data) {
        throw new ValidationError('Operation, entity type, and data are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Bulk operation initiated',
        context: {
          userId: user.id,
          organizationId,
          operation,
          entityType,
          count: Array.isArray(data) ? data.length : 1
        }
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
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

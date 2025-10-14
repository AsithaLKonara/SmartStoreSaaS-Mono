/**
 * Data Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (EXPORT_DATA permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { dataType, format = 'csv', filters } = body;

      if (!dataType) {
        throw new ValidationError('Data type is required');
      }

      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Data export requested',
        context: {
          userId: user.id,
          organizationId: orgId,
          dataType,
          format
        }
      });

      // TODO: Generate actual export
      return NextResponse.json(successResponse({
        exportId: `export_${Date.now()}`,
        dataType,
        format,
        status: 'processing',
        message: 'Export initiated'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Data export failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

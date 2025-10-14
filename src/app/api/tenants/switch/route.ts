/**
 * Switch Tenant API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (can switch between tenants)
 * 
 * System-wide: Allows SUPER_ADMIN to impersonate tenant context
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { organizationId } = body;

      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      logger.info({
        message: 'Tenant context switched',
        context: {
          userId: user.id,
          targetOrganizationId: organizationId
        }
      });

      // TODO: Update session with new organization context
      return NextResponse.json(successResponse({
        message: 'Switched to organization',
        organizationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Tenant switch failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

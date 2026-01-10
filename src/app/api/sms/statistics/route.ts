/**
 * SMS Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SMS_STATS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sms/statistics
 * SMS statistics (SUPER_ADMIN or TENANT_ADMIN)
 */
export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'SMS statistics fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Calculate actual SMS statistics
      return NextResponse.json(successResponse({
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        message: 'SMS statistics - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch SMS statistics',
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
        message: 'Failed to fetch SMS statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


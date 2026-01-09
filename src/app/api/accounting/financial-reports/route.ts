/**
 * Financial Reports API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/financial-reports
 * Get financial reports
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view financial reports');
      }

      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Financial reports fetched',
        context: {
          userId: user.id,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        reports: [],
        message: 'Financial reports - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch financial reports',
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
        message: 'Failed to fetch financial reports',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * Balance Sheet Report API Route
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
 * GET /api/accounting/reports/balance-sheet
 * Get balance sheet report
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view balance sheet');
      }

      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Balance sheet requested',
        context: {
          userId: user.id,
          organizationId: orgId
        },
        correlation: req.correlationId
      });

      // TODO: Generate actual balance sheet
      return NextResponse.json(successResponse({
        reportType: 'balance_sheet',
        assets: { total: 0, current: 0, fixed: 0 },
        liabilities: { total: 0, current: 0, longTerm: 0 },
        equity: { total: 0 },
        message: 'Balance sheet - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Balance sheet generation failed',
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
        message: 'Failed to generate balance sheet',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

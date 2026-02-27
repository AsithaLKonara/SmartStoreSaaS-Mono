/**
 * Profit & Loss Report API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { FinancialService } from '@/lib/services/financial.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/reports/profit-loss
 * Get profit & loss report
 */
export const GET = requirePermission('VIEW_ACCOUNTING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view profit & loss');
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      logger.info({
        message: 'Profit & Loss report requested',
        context: {
          userId: user.id,
          organizationId,
          startDate,
          endDate
        },
        correlation: req.correlationId
      });

      // Generate actual P&L report
      const report = await FinancialService.getProfitLoss(organizationId, startDate, endDate);

      return NextResponse.json(successResponse(report));
    } catch (error: any) {
      logger.error({
        message: 'P&L report generation failed',
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
        message: 'Failed to generate profit & loss report',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

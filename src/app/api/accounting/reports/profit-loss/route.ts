/**
 * Profit & Loss Report API Route
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
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

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

      // TODO: Generate actual P&L report
      return NextResponse.json(successResponse({
        reportType: 'profit_loss',
        revenue: { total: 0 },
        expenses: { total: 0 },
        netIncome: 0,
        message: 'Profit & Loss - implementation pending'
      }));
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

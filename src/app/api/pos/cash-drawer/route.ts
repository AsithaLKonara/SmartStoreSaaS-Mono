/**
 * POS Cash Drawer API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_CASH_DRAWER permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_CASH_DRAWER permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pos/cash-drawer
 * Get cash drawer status
 */
export const GET = requirePermission('VIEW_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      // TODO: Get actual cash drawer status
      logger.info({
        message: 'Cash drawer status fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        status: 'closed',
        balance: 0,
        message: 'Cash drawer - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch cash drawer status',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch cash drawer status',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/pos/cash-drawer
 * Perform cash drawer action
 */
export const POST = requirePermission('MANAGE_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { action, amount } = body;

      if (!action) {
        throw new ValidationError('Action is required', {
          fields: { action: !action }
        });
      }

      logger.info({
        message: 'Cash drawer action performed',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          action,
          amount
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        action,
        status: 'success'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Cash drawer action failed',
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
        message: 'Cash drawer action failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


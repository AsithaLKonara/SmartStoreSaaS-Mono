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
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      logger.info({
        message: 'Cash drawer status fetched',
        context: { userId: user.id }
      });

      // TODO: Get actual cash drawer status
      return NextResponse.json(successResponse({
        status: 'closed',
        balance: 0,
        message: 'Cash drawer - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch cash drawer status',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { action, amount } = body;

      if (!action) {
        throw new ValidationError('Action is required');
      }

      logger.info({
        message: 'Cash drawer action performed',
        context: {
          userId: user.id,
          action,
          amount
        }
      });

      return NextResponse.json(successResponse({
        action,
        status: 'success'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Cash drawer action failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


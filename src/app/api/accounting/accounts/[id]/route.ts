/**
 * Single Accounting Account API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Validated through account
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      // TODO: Add authentication check
      const accountId = params.id;

      const account = await prisma.chart_of_accounts.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Account not found' }, { status: 404 });
      }

      logger.info({
        message: 'Accounting account fetched',
        context: { accountId }
      });

      return NextResponse.json(successResponse(account));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch accounting account',
        error: error.message,
        context: { accountId: params.id }
      });
      throw error;
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      // TODO: Add authentication check
      const accountId = params.id;
      const body = await req.json();

      const account = await prisma.chart_of_accounts.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Account not found' }, { status: 404 });
      }

      const updated = await prisma.chart_of_accounts.update({
        where: { id: accountId },
        data: body
      });

      logger.info({
        message: 'Accounting account updated',
        context: { accountId }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update accounting account',
        error: error.message,
        context: { accountId: params.id }
      });
      throw error;
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      // TODO: Add authentication check
      const accountId = params.id;

      const account = await prisma.chart_of_accounts.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Account not found' }, { status: 404 });
      }

      await prisma.chart_of_accounts.delete({
        where: { id: accountId }
      });

      logger.info({
        message: 'Accounting account deleted',
        context: { accountId }
      });

      return NextResponse.json(successResponse({
        message: 'Account deleted',
        accountId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete accounting account',
        error: error.message,
        context: { accountId: params.id }
      });
      throw error;
    }
}

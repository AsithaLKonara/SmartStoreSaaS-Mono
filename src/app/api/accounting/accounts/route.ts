/**
 * Accounting Accounts List API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN, STAFF
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Add accountant role check for STAFF
    if (session.user.role === 'STAFF' && session.user.roleTag !== 'accountant') {
      return NextResponse.json({ success: false, error: 'Only accountant staff can view accounts' }, { status: 403 });
    }

    // TODO: Add organization scoping
    const orgId = session.user.organizationId;

    const accounts = await prisma.chart_of_accounts.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { code: 'asc' }
    });

    logger.info({
      message: 'Accounting accounts fetched',
      context: { userId: session.user.id, count: accounts.length }
    });

    return NextResponse.json(successResponse(accounts));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch accounting accounts',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, type, category } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ success: false, error: 'Code, name, and type are required' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    const account = await prisma.chart_of_accounts.create({
      data: {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        code,
        name,
        accountType: type,
        accountSubType: category,
        balance: 0,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Accounting account created',
      context: { userId: session.user.id, accountId: account.id }
    });

    return NextResponse.json(successResponse(account), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create accounting account',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Tax Rates API Route
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
      return NextResponse.json({ success: false, error: 'Only accountant staff can view tax rates' }, { status: 403 });
    }

    // TODO: Add organization scoping
    const orgId = session.user.organizationId;

    const taxRates = await prisma.tax_rates.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { code: 'asc' }
    });

    logger.info({
      message: 'Tax rates fetched',
      context: { userId: session.user.id, count: taxRates.length }
    });

    return NextResponse.json(successResponse(taxRates));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch tax rates',
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
    const { name, code, rate, taxType, jurisdiction } = body;

    if (!name || !code || rate === undefined) {
      return NextResponse.json({ success: false, error: 'Name, code, and rate are required' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    const taxRate = await prisma.tax_rates.create({
      data: {
        id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        name,
        code,
        rate,
        taxType: taxType || 'VAT',
        jurisdiction,
        effectiveFrom: new Date(),
        isCompound: false,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Tax rate created',
      context: { userId: session.user.id, taxRateId: taxRate.id, code }
    });

    return NextResponse.json(successResponse(taxRate), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create tax rate',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

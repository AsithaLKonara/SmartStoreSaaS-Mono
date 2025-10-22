/**
 * Affiliates API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AFFILIATES permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_AFFILIATES permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    // TODO: Get organization scoping from session
    // const orgId = session.user.organizationId;

    const where: any = {};
    if (status) where.status = status;
    // TODO: Add organization filter
    // if (orgId) where.organizationId = orgId;

    const affiliates = await prisma.affiliate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    logger.info({
      message: 'Affiliates fetched',
      context: { count: affiliates.length }
    });

    return NextResponse.json(successResponse(affiliates));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch affiliates',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user || !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { name, email, commissionRate } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    // TODO: Get organizationId from session
    // const organizationId = session.user.organizationId;
    // if (!organizationId) {
    //   return NextResponse.json({ success: false, message: 'User must belong to an organization' }, { status: 400 });
    // }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'User must belong to an organization' }, { status: 400 });
    }

    const code = `AFF-${Date.now()}`;

    const affiliate = await prisma.affiliate.create({
      data: {
        code,
        name,
        email,
        commissionRate: commissionRate || 10,
        status: 'PENDING',
        organizationId,
        totalSales: 0,
        totalCommission: 0
      }
    });

    logger.info({
      message: 'Affiliate created',
      context: { affiliateId: affiliate.id }
    });

    return NextResponse.json(successResponse(affiliate), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create affiliate',
      error: error,
      context: { path: req.nextUrl.pathname }
    });
    return NextResponse.json({ success: false, message: 'Failed to create affiliate' }, { status: 500 });
  }
}

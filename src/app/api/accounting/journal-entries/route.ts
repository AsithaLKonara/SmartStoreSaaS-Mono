/**
 * Journal Entries API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (MANAGE_ACCOUNTING permission)
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
      return NextResponse.json({ success: false, error: 'Only accountant staff can view journal entries' }, { status: 403 });
    }

    // TODO: Add organization scoping
    const orgId = session.user.organizationId;

    const entries = await prisma.journal_entries.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { entryDate: 'desc' },
      take: 100
    });

    logger.info({
      message: 'Journal entries fetched',
      context: { userId: session.user.id, count: entries.length }
    });

    return NextResponse.json(successResponse(entries));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch journal entries',
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

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN, STAFF
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Add accountant role check for STAFF
    if (session.user.role === 'STAFF' && session.user.roleTag !== 'accountant') {
      return NextResponse.json({ success: false, error: 'Only accountant staff can create journal entries' }, { status: 403 });
    }

    const body = await request.json();
    const { description, entryDate, lines } = body;

    if (!description || !lines || lines.length === 0) {
      return NextResponse.json({ success: false, error: 'Description and lines are required' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    const entry = await prisma.journal_entries.create({
      data: {
        id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        entryNumber: `JE-${Date.now()}`,
        description,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        status: 'DRAFT',
        createdBy: session.user.id,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Journal entry created',
      context: { userId: session.user.id, entryId: entry.id }
    });

    return NextResponse.json(successResponse(entry), { status: 201 });
  } catch (error: any) {
    logger.error({
      message: 'Failed to create journal entry',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

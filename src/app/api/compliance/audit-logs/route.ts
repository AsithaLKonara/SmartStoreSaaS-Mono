export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { apiLogger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const logs = await db.comprehensiveAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.comprehensiveAuditLog.count({ where });

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    apiLogger.error('Error fetching audit logs', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ success: false, message: 'Failed to fetch logs' }, { status: 500 });
  }
}

// POST - Create audit log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, userId, action, entity, entityId, beforeState, afterState, ipAddress, userAgent } = body;

    const log = await db.comprehensiveAuditLog.create({
      data: {
        organizationId,
        userId,
        action,
        entity,
        entityId,
        beforeState,
        afterState,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create log' }, { status: 500 });
  }
}


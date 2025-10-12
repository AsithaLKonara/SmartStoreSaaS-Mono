import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, AuditAction, AuditResource } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const filters: any = {
      organizationId,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    if (searchParams.get('userId')) {
      filters.userId = searchParams.get('userId');
    }
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action') as AuditAction;
    }
    if (searchParams.get('resource')) {
      filters.resource = searchParams.get('resource') as AuditResource;
    }
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }

    const { logs, total } = await getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error: any) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}


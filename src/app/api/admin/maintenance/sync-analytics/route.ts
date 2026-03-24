import { NextResponse } from 'next/server';
import { AnalyticsSnapshotService } from '@/lib/services/analytics-snapshot.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

/**
 * Maintenance API to force sync analytics snapshots.
 * Only accessible by SUPER_ADMIN or OWNER.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await req.json();
    const syncDate = date ? new Date(date) : new Date();

    await AnalyticsSnapshotService.syncAllActiveTenants(syncDate);

    return NextResponse.json({ 
      success: true, 
      message: `Analytics snapshot triggered successfully for ${syncDate.toISOString().split('T')[0]}` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to trigger snapshot sync' }, { status: 500 });
  }
}

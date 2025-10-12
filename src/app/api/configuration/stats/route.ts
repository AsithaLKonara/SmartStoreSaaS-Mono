import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { configurationManager } from '@/lib/configuration';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = configurationManager.getStatistics();
    const health = configurationManager.getHealthStatus();
    const cacheStats = configurationManager.getCacheStats();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        health,
        cacheStats
      }
    });

  } catch (error) {
    console.error('Get configuration stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration statistics' },
      { status: 500 }
    );
  }
}



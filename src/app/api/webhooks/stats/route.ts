import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { webhookManager } from '@/lib/webhooks';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpointId = searchParams.get('endpointId');

    let stats;
    
    if (endpointId) {
      stats = webhookManager.getEndpointStats(endpointId);
    } else {
      stats = webhookManager.getDeliveryStats();
    }

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get webhook stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook stats' },
      { status: 500 }
    );
  }
}



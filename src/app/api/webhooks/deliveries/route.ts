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
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    let deliveries;
    
    if (endpointId) {
      deliveries = webhookManager.getDeliveriesForEndpoint(endpointId);
    } else if (eventId) {
      deliveries = webhookManager.getDeliveriesForEvent(eventId);
    } else if (status === 'failed') {
      deliveries = webhookManager.getFailedDeliveries();
    } else if (status === 'pending') {
      deliveries = webhookManager.getPendingDeliveries();
    } else {
      deliveries = webhookManager.getAllDeliveries();
    }

    return NextResponse.json({
      success: true,
      data: deliveries
    });

  } catch (error) {
    console.error('Get webhook deliveries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook deliveries' },
      { status: 500 }
    );
  }
}



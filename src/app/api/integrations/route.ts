import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    logger.info({
      message: 'Integrations fetched',
      context: { userId: session.user.id }
    });

    // TODO: Implement actual integrations fetching
    // This would typically involve querying integrations from database
    const integrations = [
      { id: 'stripe', name: 'Stripe', status: 'connected', type: 'payment' },
      { id: 'shopify', name: 'Shopify', status: 'disconnected', type: 'ecommerce' },
      { id: 'woocommerce', name: 'WooCommerce', status: 'disconnected', type: 'ecommerce' }
    ];

    return NextResponse.json({ success: true, data: integrations });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch integrations', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch integrations' }, { status: 500 });
  }
}
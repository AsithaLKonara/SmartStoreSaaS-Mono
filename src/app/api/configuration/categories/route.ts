/**
 * Configuration Categories API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SETTINGS permission)
 * 
 * Returns available configuration categories
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    logger.info({
      message: 'Configuration categories fetched',
      context: { userId: session.user.id }
    });

    const categories = [
      { id: 'general', name: 'General Settings' },
      { id: 'payment', name: 'Payment Settings' },
      { id: 'shipping', name: 'Shipping Settings' },
      { id: 'tax', name: 'Tax Settings' },
      { id: 'email', name: 'Email Settings' },
      { id: 'integrations', name: 'Integrations' }
    ];

    return NextResponse.json(successResponse(categories));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch configuration categories',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

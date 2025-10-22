/**
 * Configuration Import API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (IMPORT_CONFIGURATION permission)
 * 
 * Organization Scoping: Imports org configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ success: false, error: 'Configuration data is required' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'User must belong to an organization' }, { status: 400 });
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { settings: JSON.stringify(config) }
    });

    logger.info({
      message: 'Configuration imported',
      context: { userId: session.user.id, organizationId }
    });

    return NextResponse.json(successResponse({
      message: 'Configuration imported successfully',
      organizationId
    }));
  } catch (error: any) {
    logger.error({
      message: 'Configuration import failed',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

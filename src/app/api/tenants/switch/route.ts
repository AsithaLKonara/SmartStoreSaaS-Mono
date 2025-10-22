import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    const tenant = await prisma.organization.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    logger.info({ message: 'Tenant switched', context: { userId: session.user.id, tenantId } });
    return NextResponse.json({ success: true, message: 'Tenant switched', tenant });
  } catch (error: any) {
    logger.error({ message: 'Tenant switch failed', error: error.message });
    return NextResponse.json({ success: false, error: 'Tenant switch failed' }, { status: 500 });
  }
}

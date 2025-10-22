import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { 
        name: true,
        settings: true
      }
    });

    logger.info({
      message: 'White label config fetched',
      context: { userId: session.user.id, organizationId: session.user.organizationId }
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch white label config', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch white label config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const updated = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { settings: body }
    });

    logger.info({
      message: 'White label config updated',
      context: { userId: session.user.id, organizationId: session.user.organizationId }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error({ message: 'Failed to update white label config', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to update white label config' }, { status: 500 });
  }
}

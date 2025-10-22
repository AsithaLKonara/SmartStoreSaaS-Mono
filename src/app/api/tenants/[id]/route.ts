import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.organization.findUnique({
      where: { id: params.id }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tenant });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch tenant', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.organization.findUnique({
      where: { id: params.id }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    await prisma.organization.delete({
      where: { id: params.id }
    });

    logger.info({ message: 'Tenant deleted', context: { userId: session.user.id, tenantId: params.id } });
    return NextResponse.json({ success: true, message: 'Tenant deleted', tenantId: params.id });
  } catch (error: any) {
    logger.error({ message: 'Failed to delete tenant', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to delete tenant' }, { status: 500 });
  }
}

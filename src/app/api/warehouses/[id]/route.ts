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

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id, organizationId: session.user.organizationId }
    });

    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: warehouse });
  } catch (error: any) {
    logger.error({ message: 'Failed to fetch warehouse', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const warehouse = await prisma.warehouse.update({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: body
    });

    logger.info({ message: 'Warehouse updated', context: { warehouseId: warehouse.id } });
    return NextResponse.json({ success: true, data: warehouse });
  } catch (error: any) {
    logger.error({ message: 'Failed to update warehouse', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id, organizationId: session.user.organizationId }
    });

    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    await prisma.warehouse.delete({
      where: { id: params.id }
    });

    logger.info({ message: 'Warehouse deleted', context: { warehouseId: params.id } });
    return NextResponse.json({ success: true, message: 'Warehouse deleted' });
  } catch (error: any) {
    logger.error({ message: 'Failed to delete warehouse', error: error.message });
    return NextResponse.json({ success: false, error: 'Failed to delete warehouse' }, { status: 500 });
  }
}

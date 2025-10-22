/**
 * Single Inventory Item API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN, STAFF
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const inventoryId = params.id;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { product: true }
    });

    if (!inventory) {
      return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 });
    }

    // TODO: Add organization scoping check
    if (inventory.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot view inventory from other organizations' }, { status: 403 });
    }

    logger.info({
      message: 'Inventory item fetched',
      context: { userId: session.user.id, inventoryId }
    });

    return NextResponse.json(successResponse(inventory));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch inventory item',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    // TODO: Add authentication check
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN, TENANT_ADMIN, STAFF
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const inventoryId = params.id;
    const body = await request.json();

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 });
    }

    // TODO: Add organization scoping check
    if (inventory.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot update inventory from other organizations' }, { status: 403 });
    }

    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: body
    });

    logger.info({
      message: 'Inventory item updated',
      context: { userId: session.user.id, inventoryId }
    });

    return NextResponse.json(successResponse(updated));
  } catch (error: any) {
    logger.error({
      message: 'Failed to update inventory item',
      error: error,
      context: { userId: session?.user?.id }
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

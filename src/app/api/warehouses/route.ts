import { NextRequest, NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import dbManager from '@/lib/database';

export const dynamic = 'force-dynamic';

async function getWarehouses(request: AuthRequest) {
  try {
    const organizationId = request.user!.organizationId;

    const warehouses = await dbManager.executeWithRetry(
      async (prisma) => await prisma.warehouse.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      }),
      'fetch warehouses'
    );

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

async function createWarehouse(request: AuthRequest) {
  try {
    const body = await request.json();
    const { name, address, capacity } = body;
    
    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    const organizationId = request.user!.organizationId;

    const warehouse = await dbManager.executeWithRetry(
      async (prisma) => await prisma.warehouse.create({
        data: {
          name,
          address,
          organizationId,
          capacity: capacity ? parseInt(capacity) : null,
          isActive: true
        }
      }),
      'create warehouse'
    );

    return NextResponse.json({
      success: true,
      data: warehouse
    });

  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}

// Export protected handlers with security middleware
export const GET = createAuthHandler(getWarehouses, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_READ],
});

export const POST = createAuthHandler(createWarehouse, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.PRODUCTS_WRITE],
});
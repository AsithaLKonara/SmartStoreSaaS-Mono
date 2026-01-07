import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    const organizationId = getOrganizationScope(user);
    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Missing organization ID' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.warehouse.count({
      where: { organizationId }
    });

    logger.info({
      message: 'Warehouses fetched',
      context: {
        count: warehouses.length,
        page,
        limit,
        organizationId
      },
      correlation: req.correlationId
    });

    return NextResponse.json(
      successResponse(
        { warehouses },
        { pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
      )
    );
  }
);

export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    const organizationId = getOrganizationScope(user);
    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Missing organization ID' 
      }, { status: 401 });
    }

    const body = await req.json();
    const warehouse = await prisma.warehouse.create({
      data: {
        ...body,
        organizationId
      }
    });

    logger.info({ 
      message: 'Warehouse created', 
      context: { 
        warehouseId: warehouse.id,
        organizationId,
        userId: user.id
      },
      correlation: req.correlationId
    });
    
    return NextResponse.json(
      successResponse(warehouse),
      { status: 201 }
    );
  }
);

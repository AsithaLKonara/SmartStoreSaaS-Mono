/**
 * Single Warehouse API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, AuthorizationError, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/warehouses/[id]
 * Get single warehouse
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const warehouseId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        const warehouse = await prisma.warehouse.findUnique({
          where: { id: warehouseId }
        });

        if (!warehouse) {
          throw new NotFoundError('Warehouse not found');
        }

        if (!validateOrganizationAccess(user, warehouse.organizationId)) {
          throw new AuthorizationError('Cannot view warehouses from other organizations');
        }

        logger.info({
          message: 'Warehouse fetched',
          context: {
            userId: user.id,
            warehouseId,
            organizationId: warehouse.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(warehouse));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch warehouse',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            warehouseId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch warehouse',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * PUT /api/warehouses/[id]
 * Update warehouse
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const warehouseId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        const warehouse = await prisma.warehouse.findUnique({
          where: { id: warehouseId }
        });

        if (!warehouse) {
          throw new NotFoundError('Warehouse not found');
        }

        if (!validateOrganizationAccess(user, warehouse.organizationId)) {
          throw new AuthorizationError('Cannot update warehouses from other organizations');
        }

        const body = await req.json();
        const updatedWarehouse = await prisma.warehouse.update({
          where: { id: warehouseId },
          data: body
        });

        logger.info({
          message: 'Warehouse updated',
          context: {
            userId: user.id,
            warehouseId,
            organizationId: warehouse.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(updatedWarehouse));
      } catch (error: any) {
        logger.error({
          message: 'Failed to update warehouse',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            warehouseId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to update warehouse',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * DELETE /api/warehouses/[id]
 * Delete warehouse
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const warehouseId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const organizationId = getOrganizationScope(user);
        if (!organizationId) {
          throw new ValidationError('User must belong to an organization');
        }

        const warehouse = await prisma.warehouse.findUnique({
          where: { id: warehouseId }
        });

        if (!warehouse) {
          throw new NotFoundError('Warehouse not found');
        }

        if (!validateOrganizationAccess(user, warehouse.organizationId)) {
          throw new AuthorizationError('Cannot delete warehouses from other organizations');
        }

        await prisma.warehouse.delete({
          where: { id: warehouseId }
        });

        logger.info({
          message: 'Warehouse deleted',
          context: {
            userId: user.id,
            warehouseId,
            organizationId: warehouse.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({ message: 'Warehouse deleted successfully' }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to delete warehouse',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            warehouseId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to delete warehouse',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}

/**
 * Single Procurement Supplier API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SUPPLIERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SUPPLIERS permission)
 * 
 * Organization Scoping: Validated through supplier
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/procurement/suppliers/[id]
 * Get supplier by ID
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supplierId = params.id;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        throw new NotFoundError('Supplier not found');
      }

      await validateOrganizationAccess(user, supplier.organizationId);

      logger.info({
        message: 'Procurement supplier fetched',
        context: {
          userId: user.id,
          organizationId: supplier.organizationId,
          supplierId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(supplier));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch procurement supplier',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch procurement supplier',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * PUT /api/procurement/suppliers/[id]
 * Update supplier
 */
export const PUT = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supplierId = params.id;
      const body = await req.json();

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        throw new NotFoundError('Supplier not found');
      }

      await validateOrganizationAccess(user, supplier.organizationId);

      const updated = await prisma.supplier.update({
        where: { id: supplierId },
        data: body
      });

      logger.info({
        message: 'Procurement supplier updated',
        context: {
          userId: user.id,
          organizationId: supplier.organizationId,
          supplierId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update procurement supplier',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to update procurement supplier',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/procurement/suppliers/[id]
 * Delete supplier
 */
export const DELETE = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supplierId = params.id;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        throw new NotFoundError('Supplier not found');
      }

      await validateOrganizationAccess(user, supplier.organizationId);

      await prisma.supplier.delete({
        where: { id: supplierId }
      });

      logger.info({
        message: 'Procurement supplier deleted',
        context: {
          userId: user.id,
          organizationId: supplier.organizationId,
          supplierId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Supplier deleted',
        supplierId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete procurement supplier',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to delete procurement supplier',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


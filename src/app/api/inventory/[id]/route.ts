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
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/[id]
 * Get single inventory item with organization scoping
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const productId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            category: true,
            organization: true
          }
        });

        if (!product) {
          throw new NotFoundError('Product not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, product.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot view product from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        logger.info({
          message: 'Product fetched',
          context: {
            userId: user.id,
            productId,
            organizationId: product.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(product));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch inventory item',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch inventory item',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * PUT /api/inventory/[id]
 * Update inventory item with organization scoping
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const productId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();

        const product = await prisma.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new NotFoundError('Product not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, product.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot update product from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        const updated = await prisma.product.update({
          where: { id: productId },
          data: body
        });

        logger.info({
          message: 'Product updated',
          context: {
            userId: user.id,
            productId,
            organizationId: product.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(updated));
      } catch (error: any) {
        logger.error({
          message: 'Failed to update inventory item',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to update inventory item',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

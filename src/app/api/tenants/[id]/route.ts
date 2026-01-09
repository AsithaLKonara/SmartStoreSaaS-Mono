/**
 * Single Tenant API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_ALL_ORGANIZATIONS permission)
 * - PUT: SUPER_ADMIN only (MANAGE_ORGANIZATIONS permission)
 * - DELETE: SUPER_ADMIN only (MANAGE_ORGANIZATIONS permission)
 * 
 * Organization Scoping: SUPER_ADMIN can access any organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tenants/[id]
 * Get single tenant/organization (SUPER_ADMIN only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const tenantId = resolvedParams.id;
  
  const handler = requireRole('SUPER_ADMIN')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const tenant = await prisma.organization.findUnique({
          where: { id: tenantId },
          include: {
            _count: {
              select: {
                users: true,
                products: true,
                orders: true
              }
            }
          }
        });

        if (!tenant) {
          throw new NotFoundError('Tenant not found');
        }

        logger.info({
          message: 'Tenant fetched',
          context: {
            userId: user.id,
            tenantId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse({
          ...tenant,
          userCount: tenant._count.users,
          productCount: tenant._count.products,
          orderCount: tenant._count.orders
        }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch tenant',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            tenantId,
            userId: user.id
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to fetch tenant',
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
 * PUT /api/tenants/[id]
 * Update tenant/organization (SUPER_ADMIN only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const tenantId = resolvedParams.id;
  
  const handler = requireRole('SUPER_ADMIN')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();

        const tenant = await prisma.organization.findUnique({
          where: { id: tenantId }
        });

        if (!tenant) {
          throw new NotFoundError('Tenant not found');
        }

        const updated = await prisma.organization.update({
          where: { id: tenantId },
          data: body
        });

        logger.info({
          message: 'Tenant updated',
          context: {
            userId: user.id,
            tenantId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(updated));
      } catch (error: any) {
        logger.error({
          message: 'Failed to update tenant',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            tenantId,
            userId: user.id
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to update tenant',
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
 * DELETE /api/tenants/[id]
 * Delete tenant/organization (SUPER_ADMIN only)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const tenantId = resolvedParams.id;
  
  const handler = requireRole('SUPER_ADMIN')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const tenant = await prisma.organization.findUnique({
          where: { id: tenantId }
        });

        if (!tenant) {
          throw new NotFoundError('Tenant not found');
        }

        await prisma.organization.delete({
          where: { id: tenantId }
        });

        logger.info({
          message: 'Tenant deleted',
          context: {
            userId: user.id,
            tenantId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Tenant deleted successfully',
          tenantId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to delete tenant',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            tenantId,
            userId: user.id
          },
          correlation: req.correlationId
        });
        
        if (error instanceof NotFoundError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to delete tenant',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

/**
 * Single Customer API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_CUSTOMERS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CUSTOMERS permission)
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
 * GET /api/customers/[id]
 * Get single customer with organization scoping
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const customerId = resolvedParams.id;
  
  const handler = requirePermission('VIEW_CUSTOMERS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (!customer) {
          throw new NotFoundError('Customer not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, customer.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot view customers from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        logger.info({
          message: 'Customer fetched',
          context: {
            userId: user.id,
            customerId,
            organizationId: customer.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(customer));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch customer',
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
          message: 'Failed to fetch customer',
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
 * PUT /api/customers/[id]
 * Update customer with organization scoping
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const customerId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_CUSTOMERS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();

        const customer = await prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (!customer) {
          throw new NotFoundError('Customer not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, customer.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot update customers from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        const updated = await prisma.customer.update({
          where: { id: customerId },
          data: body
        });

        logger.info({
          message: 'Customer updated',
          context: {
            userId: user.id,
            customerId,
            organizationId: customer.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse(updated));
      } catch (error: any) {
        logger.error({
          message: 'Failed to update customer',
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
          message: 'Failed to update customer',
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
 * DELETE /api/customers/[id]
 * Delete customer with organization scoping
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const customerId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_CUSTOMERS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (!customer) {
          throw new NotFoundError('Customer not found');
        }

        // Validate organization access
        if (!validateOrganizationAccess(user, customer.organizationId)) {
          return NextResponse.json({
            success: false,
            code: 'ERR_FORBIDDEN',
            message: 'Cannot delete customers from other organizations',
            correlation: req.correlationId || 'unknown'
          }, { status: 403 });
        }

        await prisma.customer.delete({
          where: { id: customerId }
        });

        logger.info({
          message: 'Customer deleted',
          context: {
            userId: user.id,
            customerId,
            organizationId: customer.organizationId
          },
          correlation: req.correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Customer deleted',
          customerId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to delete customer',
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
          message: 'Failed to delete customer',
          correlation: req.correlationId || 'unknown'
        }, { status: 500 });
      }
    }
  );
  
  const req = request as AuthenticatedRequest;
  req.correlationId = correlationId;
  return handler(req, {} as any);
}

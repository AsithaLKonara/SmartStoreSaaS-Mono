/**
 * Fulfillment Ship API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_FULFILLMENT permission)
 * 
 * Organization Scoping: Validated through fulfillment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fulfillment/[id]/ship
 * Ship fulfillment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const fulfillmentId = resolvedParams.id;

  const handler = requirePermission(Permission.INVENTORY_MANAGE)(
    async (req: AuthenticatedRequest, user) => {
      try {
        let body: any = {};
        try { body = await req.json(); } catch (e) { }
        const { trackingNumber, carrier } = body;

        const fulfillment = await prisma.fulfillment.findUnique({
          where: { id: fulfillmentId }
        });

        if (!fulfillment) {
          throw new NotFoundError('Fulfillment not found');
        }

        if (!validateOrganizationAccess(user, fulfillment.organizationId)) {
          throw new AuthorizationError('Cannot ship fulfillment from other organizations');
        }

        await prisma.fulfillment.update({
          where: { id: fulfillmentId },
          data: {
            status: 'SHIPPED',
            trackingNumber: trackingNumber || `TRK-${Date.now()}`,
            carrier: carrier || 'Standard Courier',
            shippedAt: new Date()
          }
        });

        logger.info({
          message: 'Fulfillment shipped',
          context: {
            userId: user.id,
            fulfillmentId,
            trackingNumber,
            organizationId: fulfillment.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Order shipped successfully',
          fulfillmentId,
          trackingNumber
        }));
      } catch (error: any) {
        logger.error({
          message: 'Fulfillment ship failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            fulfillmentId
          },
          correlation: correlationId
        });

        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }

        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to ship fulfillment',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}


/**
 * Fulfillment Pick API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_FULFILLMENT permission)
 * 
 * Organization Scoping: Validated through fulfillment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fulfillment/[id]/pick
 * Pick fulfillment items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const fulfillmentId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const fulfillment = await prisma.delivery.findUnique({
          where: { id: fulfillmentId }
        });

        if (!fulfillment) {
          throw new NotFoundError('Fulfillment not found');
        }

        if (!validateOrganizationAccess(user, fulfillment.organizationId)) {
          throw new AuthorizationError('Cannot pick fulfillment from other organizations');
        }

      await prisma.delivery.update({
        where: { id: fulfillmentId },
        data: {
          status: 'PICKED'
        }
      });

        logger.info({
          message: 'Fulfillment items picked',
          context: {
            userId: user.id,
            fulfillmentId,
            organizationId: fulfillment.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Items picked successfully',
          fulfillmentId
        }));
      } catch (error: any) {
        logger.error({
          message: 'Fulfillment pick failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            fulfillmentId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to pick fulfillment',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}


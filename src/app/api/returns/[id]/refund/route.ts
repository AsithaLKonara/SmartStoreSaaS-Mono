/**
 * Return Refund Processing API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (PROCESS_REFUNDS permission)
 * 
 * Organization Scoping: Validated through return
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, NotFoundError, AuthorizationError, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/returns/[id]/refund
 * Process refund for return
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const returnId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_ORDERS')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { refundAmount, refundMethod } = body;

        const returnRequest = await prisma.return.findUnique({
          where: { id: returnId }
        });

        if (!returnRequest) {
          throw new NotFoundError('Return not found');
        }

        if (!validateOrganizationAccess(user, returnRequest.organizationId)) {
          throw new AuthorizationError('Cannot process refunds for other organizations');
        }

        if (returnRequest.status !== 'APPROVED') {
          throw new ValidationError('Return must be approved before refund');
        }

      await prisma.return.update({
        where: { id: returnId },
        data: {
          status: 'REFUNDED',
          refundAmount,
          refundMethod
        }
      });

        logger.info({
          message: 'Return refund processed',
          context: {
            userId: user.id,
            returnId,
            refundAmount,
            refundMethod,
            organizationId: returnRequest.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse({
          message: 'Refund processed successfully',
          returnId,
          refundAmount
        }));
      } catch (error: any) {
        logger.error({
          message: 'Return refund processing failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            returnId
          },
          correlation: correlationId
        });
        
        if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to process refund',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}


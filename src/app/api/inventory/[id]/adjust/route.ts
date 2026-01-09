/**
 * Inventory Adjustment API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (ADJUST_INVENTORY permission)
 * 
 * Organization Scoping: Validated through inventory item
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/inventory/[id]/adjust
 * Adjust inventory quantity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const inventoryId = resolvedParams.id;
  
  const handler = requirePermission('MANAGE_INVENTORY')(
    async (req: AuthenticatedRequest, user) => {
      try {
        const body = await req.json();
        const { adjustment, reason } = body;

      if (adjustment === undefined || !reason) {
        throw new ValidationError('Adjustment amount and reason are required');
      }

      const inventory = await prisma.product.findUnique({
        where: { id: inventoryId }
      });

        if (!inventory) {
          throw new NotFoundError('Product not found');
        }

        if (!validateOrganizationAccess(user, inventory.organizationId)) {
          throw new AuthorizationError('Cannot adjust inventory from other organizations');
        }

      const updated = await prisma.product.update({
        where: { id: inventoryId },
        data: {
          stock: { increment: adjustment }
        }
      });

      // Log the adjustment
      await prisma.inventoryMovement.create({
        data: {
          productId: inventory.id,
          quantity: adjustment,
          type: adjustment > 0 ? 'IN' : 'OUT',
          reason,
          reference: `User: ${user.id}`
        }
      });

        logger.info({
          message: 'Inventory adjusted',
          context: {
            userId: user.id,
            inventoryId,
            adjustment,
            reason,
            organizationId: inventory.organizationId
          },
          correlation: correlationId
        });

        return NextResponse.json(successResponse(updated));
      } catch (error: any) {
        logger.error({
          message: 'Inventory adjustment failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            inventoryId
          },
          correlation: correlationId
        });
        
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }
        
        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to adjust inventory',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}


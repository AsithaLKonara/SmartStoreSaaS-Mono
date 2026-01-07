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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      // Extract inventory ID from URL path
      const url = new URL(request.url);
      const inventoryId = url.pathname.split('/').pop();
      const body = await request.json();
      const { adjustment, reason } = body;

      if (adjustment === undefined || !reason) {
        throw new ValidationError('Adjustment amount and reason are required');
      }

      const inventory = await prisma.product.findUnique({
        where: { id: inventoryId }
      });

      if (!inventory) {
        throw new ValidationError('Product not found');
      }

      if (inventory.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot adjust inventory from other organizations');
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
          reason
        }
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Inventory adjustment failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


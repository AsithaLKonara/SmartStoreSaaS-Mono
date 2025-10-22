/**
 * Inventory Movement API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const movements = await prisma.inventoryMovement.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Inventory movements fetched',
        context: { userId: user.id, count: movements.length }
      });

      return NextResponse.json(successResponse(movements));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch inventory movements',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { productId, quantity, type, reason } = body;

      if (!productId || !quantity || !type) {
        throw new ValidationError('Product ID, quantity, and type are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const movement = await prisma.inventoryMovement.create({
        data: {
          organizationId,
          productId,
          quantity,
          type,
          reason,
          createdBy: user.id
        }
      });

      logger.info({
        message: 'Inventory movement recorded',
        context: { userId: user.id, movementId: movement.id }
      });

      return NextResponse.json(successResponse(movement), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to record inventory movement',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


/**
 * Warehouse Movements API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/warehouses/movements
 * Get warehouse movements
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const warehouseId = searchParams.get('warehouseId');

      const where: any = { organizationId };
      if (warehouseId) where.warehouseId = warehouseId;

      const movements = await prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Warehouse movements fetched',
        context: {
          userId: user.id,
          warehouseId,
          count: movements.length,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(movements));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch warehouse movements',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch warehouse movements',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


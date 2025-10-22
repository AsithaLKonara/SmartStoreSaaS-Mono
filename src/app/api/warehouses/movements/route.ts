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

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const warehouseId = searchParams.get('warehouseId');

      const orgId = getOrganizationScope(user);

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (warehouseId) where.warehouseId = warehouseId;

      const movements = await prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Warehouse movements fetched',
        context: { userId: user.id, warehouseId, count: movements.length }
      });

      return NextResponse.json(successResponse(movements));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch warehouse movements',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


/**
 * Warehouse Inventory API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
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

      const inventory = await prisma.inventory.findMany({
        where,
        include: { product: true },
        orderBy: { product: { name: 'asc' } }
      });

      logger.info({
        message: 'Warehouse inventory fetched',
        context: { userId: user.id, warehouseId, count: inventory.length }
      });

      return NextResponse.json(successResponse(inventory));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch warehouse inventory',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

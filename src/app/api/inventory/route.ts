/**
 * Inventory API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const GET = requirePermission('VIEW_INVENTORY')(
  async (request, user) => {
    const orgId = getOrganizationScope(user);
    
    const inventory = await prisma.product.findMany({
      where: orgId ? { organizationId: orgId } : {},
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        price: true,
        organizationId: true
      }
    });
    
    logger.info({
      message: 'Inventory fetched',
      context: { userId: user.id, count: inventory.length }
    });
    
    return NextResponse.json(successResponse(inventory));
  }
);

export const POST = requirePermission('MANAGE_INVENTORY')(
  async (request, user) => {
    return NextResponse.json(successResponse({ 
      message: 'Inventory management endpoint',
      status: 'coming_soon'
    }));
  }
);

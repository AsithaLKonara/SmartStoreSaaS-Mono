/**
 * Courier Deliveries API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_DELIVERIES permission)
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
      const orgId = getOrganizationScope(user);

      const deliveries = await prisma.delivery.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Courier deliveries fetched',
        context: { userId: user.id, count: deliveries.length }
      });

      return NextResponse.json(successResponse(deliveries));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch courier deliveries',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

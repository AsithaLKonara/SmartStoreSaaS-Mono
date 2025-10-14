/**
 * Webhook Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WEBHOOK_STATS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Webhook statistics fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Calculate actual webhook statistics
      return NextResponse.json(successResponse({
        totalDeliveries: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        message: 'Webhook statistics - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhook statistics',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

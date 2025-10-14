/**
 * Webhook Deliveries API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WEBHOOK_DELIVERIES permission)
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
        message: 'Webhook deliveries fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Fetch actual webhook deliveries
      return NextResponse.json(successResponse({
        deliveries: [],
        message: 'Webhook deliveries - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhook deliveries',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

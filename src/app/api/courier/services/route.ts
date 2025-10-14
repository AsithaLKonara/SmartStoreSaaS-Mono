/**
 * Courier Services API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_COURIER_SERVICES permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Courier services fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      // TODO: Fetch available courier services
      return NextResponse.json(successResponse({
        services: [],
        message: 'Courier services - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch courier services',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

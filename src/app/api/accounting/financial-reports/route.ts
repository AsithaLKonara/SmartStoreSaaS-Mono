/**
 * Financial Reports API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view financial reports');
      }

      const orgId = getOrganizationScope(user);

      logger.info({
        message: 'Financial reports fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      return NextResponse.json(successResponse({
        reports: [],
        message: 'Financial reports - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch financial reports',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

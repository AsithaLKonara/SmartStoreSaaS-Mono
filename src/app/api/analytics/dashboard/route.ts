/**
 * Analytics Dashboard API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_ANALYTICS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { databaseOptimizer } from '@/lib/database/performance-optimizer';

export const dynamic = 'force-dynamic';

export const GET = requirePermission(Permission.ANALYTICS_READ)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || '30';
      const requestOrgId = searchParams.get('organizationId') || undefined;

      const organizationId = getOrganizationScope(user, requestOrgId);
      if (!organizationId) {
        return NextResponse.json({
          success: false,
          message: 'Organization not found',
          correlation: req.correlationId
        }, { status: 400 });
      }

      const { data: analytics, executionTime, fromCache } = await databaseOptimizer.getOptimizedFullDashboard(
        organizationId,
        parseInt(period)
      );


      logger.info({
        message: 'Analytics dashboard fetched',
        context: {
          period,
          organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(analytics));
    } catch (error: any) {
      logger.error({
        message: 'Analytics dashboard error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          organizationId: user.organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Analytics dashboard error',
        correlation: req.correlationId
      }, { status: 500 });
    }
  }
);


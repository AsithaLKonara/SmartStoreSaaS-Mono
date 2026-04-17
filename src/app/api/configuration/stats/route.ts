/**
 * Configuration Statistics API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_CONFIG_STATS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { Permission, requirePermission, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/configuration/stats
 * Get configuration statistics
 */
import { prisma } from '@/lib/prisma';

export const GET = requirePermission(Permission.SETTINGS_MANAGE)(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true, updatedAt: true }
      });

      const settings = (org?.settings as any) || {};
      const totalConfigs = Object.keys(settings).length;

      logger.info({
        message: 'Configuration statistics generated',
        context: { userId: user.id, organizationId, totalConfigs }
      });

      return NextResponse.json(successResponse({
        totalConfigs,
        activeConfigs: totalConfigs, // Assume all in JSON are active
        lastModified: org?.updatedAt || new Date().toISOString(),
        message: 'Configuration stats generated from Organization settings'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch configuration statistics',
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
        message: 'Failed to fetch configuration statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * Configuration Export API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (EXPORT_CONFIGURATION permission)
 * 
 * Organization Scoping: Exports org configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/configuration/export
 * Export configuration
 */
export const POST = requirePermission('MANAGE_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true }
      });

      logger.info({
        message: 'Configuration exported',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        config: organization?.settings || {},
        exportedAt: new Date().toISOString()
      }));
    } catch (error: any) {
      logger.error({
        message: 'Configuration export failed',
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
        message: 'Failed to export configuration',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * Configuration Import API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (IMPORT_CONFIGURATION permission)
 * 
 * Organization Scoping: Imports org configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/configuration/import
 * Import configuration
 */
export const POST = requirePermission('MANAGE_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { config } = body;

      if (!config) {
        throw new ValidationError('Configuration data is required');
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: { settings: JSON.stringify(config) }
      });

      logger.info({
        message: 'Configuration imported',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Configuration imported successfully',
        organizationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Configuration import failed',
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
        message: 'Failed to import configuration',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

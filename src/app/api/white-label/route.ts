import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requirePermission, getOrganizationScope, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError, NotFoundError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/white-label
 * Get white-label configuration (VIEW_SETTINGS permission)
 */
export const GET = requirePermission('VIEW_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const config = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { 
          name: true,
          settings: true
        }
      });

      if (!config) {
        throw new NotFoundError('Organization not found');
      }

      logger.info({
        message: 'White label config fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(config));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch white label config',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch white label config',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/white-label
 * Update white-label configuration (MANAGE_SETTINGS permission)
 */
export const POST = requirePermission('MANAGE_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      
      // Validate organization exists and user has access
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      await validateOrganizationAccess(user, organizationId);

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { settings: body }
      });

      logger.info({
        message: 'White label config updated',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(updated));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update white label config',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to update white label config',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

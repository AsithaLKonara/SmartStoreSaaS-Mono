/**
 * Configuration API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SETTINGS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SETTINGS permission)
 * 
 * Organization Scoping: User's organization settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Permission, requirePermission, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requirePermission(Permission.SETTINGS_MANAGE)(
  async (request: AuthenticatedRequest, user) => {
    try {
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          settings: true
        }
      });

      logger.info({
        message: 'Configuration fetched',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        settings: organization?.settings || {},
        organizationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch configuration',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requirePermission(Permission.SETTINGS_MANAGE)(
  async (request: AuthenticatedRequest, user) => {
    try {
      const body = await request.json();
      const { settings } = body;

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: { settings: JSON.stringify(settings) }
      });

      logger.info({
        message: 'Configuration updated',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        message: 'Configuration updated',
        settings
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update configuration',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

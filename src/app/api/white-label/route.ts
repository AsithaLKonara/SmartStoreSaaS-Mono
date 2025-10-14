/**
 * White Label Configuration API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WHITE_LABEL permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WHITE_LABEL permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          whiteLabelConfig: true
        }
      });

      logger.info({
        message: 'White label config fetched',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        config: organization?.whiteLabelConfig || {},
        organizationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch white label config',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { logo, primaryColor, secondaryColor, companyName } = body;

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          whiteLabelConfig: JSON.stringify({
            logo,
            primaryColor,
            secondaryColor,
            companyName
          })
        }
      });

      logger.info({
        message: 'White label config updated',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        message: 'White label configuration updated',
        organizationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to update white label config',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

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
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true }
      });

      logger.info({
        message: 'Configuration exported',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        config: organization?.settings || {},
        exportedAt: new Date().toISOString()
      }));
    } catch (error: any) {
      logger.error({
        message: 'Configuration export failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

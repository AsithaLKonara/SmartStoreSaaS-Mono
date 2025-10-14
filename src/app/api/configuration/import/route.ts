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
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { config } = body;

      if (!config) {
        throw new ValidationError('Configuration data is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: { settings: JSON.stringify(config) }
      });

      logger.info({
        message: 'Configuration imported',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse({
        message: 'Configuration imported successfully',
        organizationId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Configuration import failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

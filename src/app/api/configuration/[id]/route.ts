/**
 * Single Configuration API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SETTINGS permission)
 * - PUT: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SETTINGS permission)
 * - DELETE: SUPER_ADMIN, TENANT_ADMIN (MANAGE_SETTINGS permission)
 * 
 * Organization Scoping: Validated through configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const configId = params.id;

      const config = await prisma.configuration.findUnique({
        where: { id: configId }
      });

      if (!config) {
        throw new ValidationError('Configuration not found');
      }

      if (config.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view configurations from other organizations');
      }

      logger.info({
        message: 'Configuration fetched',
        context: { userId: user.id, configId }
      });

      return NextResponse.json(successResponse(config));
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

export const PUT = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const configId = params.id;
      const body = await request.json();

      const config = await prisma.configuration.findUnique({
        where: { id: configId }
      });

      if (!config) {
        throw new ValidationError('Configuration not found');
      }

      if (config.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot update configurations from other organizations');
      }

      const updated = await prisma.configuration.update({
        where: { id: configId },
        data: body
      });

      logger.info({
        message: 'Configuration updated',
        context: { userId: user.id, configId }
      });

      return NextResponse.json(successResponse(updated));
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

export const DELETE = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const configId = params.id;

      const config = await prisma.configuration.findUnique({
        where: { id: configId }
      });

      if (!config) {
        throw new ValidationError('Configuration not found');
      }

      if (config.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot delete configurations from other organizations');
      }

      await prisma.configuration.delete({
        where: { id: configId }
      });

      logger.info({
        message: 'Configuration deleted',
        context: { userId: user.id, configId }
      });

      return NextResponse.json(successResponse({
        message: 'Configuration deleted',
        configId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to delete configuration',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

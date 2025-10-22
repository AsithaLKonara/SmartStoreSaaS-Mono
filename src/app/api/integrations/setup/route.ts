/**
 * Integrations Setup API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_INTEGRATIONS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_INTEGRATIONS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const integrations = await prisma.channel_integrations.findMany({
        where: orgId ? { organizationId: orgId } : {},
        select: {
          id: true,
          name: true,
          type: true,
          provider: true,
          channel: true,
          status: true,
          isActive: true,
          createdAt: true,
          // Don't expose credentials
        }
      });

      logger.info({
        message: 'Integrations fetched',
        context: { userId: user.id, count: integrations.length }
      });

      return NextResponse.json(successResponse(integrations));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch integrations',
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
      const { name, type, provider, channel, credentials, settings } = body;

      if (!name || !type || !provider) {
        throw new ValidationError('Name, type, and provider are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // TODO: Encrypt credentials before storing
      const integration = await prisma.channel_integrations.create({
        data: {
          organizationId,
          name,
          type,
          provider,
          channel: channel || provider,
          status: 'INACTIVE',
          credentials: JSON.stringify(credentials),
          settings: JSON.stringify(settings || {}),
          isActive: false
        }
      });

      logger.info({
        message: 'Integration created',
        context: {
          userId: user.id,
          integrationId: integration.id,
          provider
        }
      });

      return NextResponse.json(successResponse(integration), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create integration',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

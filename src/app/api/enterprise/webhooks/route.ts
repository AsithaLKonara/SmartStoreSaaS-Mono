/**
 * Enterprise Webhooks Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WEBHOOKS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WEBHOOKS permission)
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

      const webhooks = await prisma.webhook.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Webhooks fetched',
        context: { userId: user.id, count: webhooks.length }
      });

      return NextResponse.json(successResponse(webhooks));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhooks',
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
      const { url, events, description } = body;

      if (!url || !events || !Array.isArray(events)) {
        throw new ValidationError('URL and events array are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const webhook = await prisma.webhook.create({
        data: {
          organizationId,
          url,
          events,
          description,
          isActive: true,
          secret: `whsec_${Math.random().toString(36).substr(2, 32)}`
        }
      });

      logger.info({
        message: 'Webhook created',
        context: { userId: user.id, webhookId: webhook.id }
      });

      return NextResponse.json(successResponse(webhook), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create webhook',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

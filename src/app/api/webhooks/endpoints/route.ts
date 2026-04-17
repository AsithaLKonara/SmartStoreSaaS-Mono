/**
 * Webhook Endpoints API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_WEBHOOKS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_WEBHOOKS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getOrganizationScope } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const endpoints = await prisma.webhookSubscription.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      logger.info({
        message: 'Webhook endpoints fetched',
        context: { userId: user.id, organizationId: orgId }
      });

      return NextResponse.json(successResponse({ endpoints }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhook endpoints',
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
      const { url, events, secret } = body;

      if (!url || !events) {
        throw new ValidationError('URL and events are required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Webhook endpoint created',
        context: { userId: user.id, organizationId, url, events }
      });

      const endpoint = await prisma.webhookSubscription.create({
        data: {
          organizationId,
          name: `Webhook ${url}`,
          url,
          events,
          secret: secret || null,
        }
      });

      return NextResponse.json(successResponse({
        message: 'Webhook created',
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create webhook endpoint',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

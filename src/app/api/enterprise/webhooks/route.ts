import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

import { WebhookService } from '@/lib/services/webhook.service';

/**
 * GET /api/enterprise/webhooks
 * Get enterprise webhooks (VIEW_WEBHOOKS permission)
 */
export const GET = requirePermission('VIEW_WEBHOOKS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const webhooks = await WebhookService.getSubscriptions(organizationId);

      logger.info({
        message: 'Webhooks fetched',
        context: {
          userId: user.id,
          organizationId,
          count: webhooks.length
        }
      });

      return NextResponse.json(successResponse(webhooks));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhooks',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { userId: user.id }
      });

      return NextResponse.json({
        success: false,
        message: 'Failed to fetch webhooks',
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/enterprise/webhooks
 * Create enterprise webhook (MANAGE_WEBHOOKS permission)
 */
export const POST = requirePermission('MANAGE_WEBHOOKS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, url, events, secret } = body;

      if (!name || !url || !events || !Array.isArray(events)) {
        throw new ValidationError('Name, URL, and Events array are required');
      }

      const newWebhook = await WebhookService.createSubscription({
        organizationId,
        name,
        url,
        events,
        secret
      });

      logger.info({
        message: 'Webhook created',
        context: {
          userId: user.id,
          organizationId,
          webhookId: newWebhook.id
        }
      });

      return NextResponse.json(successResponse(newWebhook), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create webhook',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { userId: user.id }
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      return NextResponse.json({
        success: false,
        message: 'Failed to create webhook',
      }, { status: 500 });
    }
  }
);
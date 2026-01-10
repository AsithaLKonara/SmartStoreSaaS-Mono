import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

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

      logger.info({
        message: 'Webhooks fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement webhooks fetching
      // This would typically involve querying webhooks from database
      const webhooks = [
        {
          id: 'webhook_1',
          name: 'Order Created Webhook',
          url: 'https://example.com/webhooks/orders',
          events: ['order.created', 'order.updated'],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];

      return NextResponse.json(successResponse(webhooks));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch webhooks',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch webhooks',
        correlation: req.correlationId || 'unknown'
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

      logger.info({
        message: 'Webhook created',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement webhook creation
      // This would typically involve creating webhook in database
      const newWebhook = {
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        url: body.url,
        events: body.events || [],
        isActive: true,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json(successResponse(newWebhook), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create webhook',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create webhook',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
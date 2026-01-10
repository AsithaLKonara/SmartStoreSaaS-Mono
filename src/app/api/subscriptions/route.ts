import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscriptions
 * Get subscriptions (VIEW_SUBSCRIPTIONS permission)
 */
export const GET = requirePermission('VIEW_SUBSCRIPTIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');

      logger.info({
        message: 'Subscriptions fetched',
        context: {
          userId: user.id,
          organizationId,
          page,
          limit,
          status
        },
        correlation: req.correlationId
      });

      // Build where clause
      const where: any = { organizationId };
      if (status) where.status = status;

      // Query actual subscriptions from database
      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            organization: {
              select: { name: true }
            }
          }
        }),
        prisma.subscription.count({ where })
      ]);

      return NextResponse.json(successResponse({
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch subscriptions',
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
        message: 'Failed to fetch subscriptions',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/subscriptions
 * Manage subscription actions (VIEW_SUBSCRIPTIONS permission - for now, may need MANAGE_SUBSCRIPTIONS)
 */
export const POST = requirePermission('VIEW_SUBSCRIPTIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { action, subscriptionId, planId, customerId } = body;

      // Validate required fields
      if (!action) {
        throw new ValidationError('Action is required', {
          fields: { action: !action }
        });
      }

      const validActions = ['create', 'update', 'cancel', 'reactivate', 'pause', 'resume'];
      if (!validActions.includes(action)) {
        throw new ValidationError(`Invalid action. Must be one of: ${validActions.join(', ')}`, {
          fields: { action: !validActions.includes(action) }
        });
      }

      logger.info({
        message: 'Subscription action requested',
        context: {
          userId: user.id,
          organizationId,
          action,
          subscriptionId,
          planId,
          customerId
        },
        correlation: req.correlationId
      });

      // TODO: Implement actual subscription actions
      // This would typically involve:
      // 1. Validating subscription and permissions
      // 2. Processing the requested action
      // 3. Updating subscription status
      // 4. Sending notifications
      // 5. Returning updated subscription

      const subscription = {
        id: subscriptionId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        status: action === 'cancel' ? 'cancelled' : 'active',
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json(successResponse({
        message: `Subscription ${action} successful`,
        data: subscription
      }));
    } catch (error: any) {
      logger.error({
        message: 'Subscription action failed',
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
        message: 'Subscription action failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
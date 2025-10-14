/**
 * Subscriptions API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_BILLING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_BILLING permission)
 * 
 * Organization Scoping: User's organization subscription only
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

      const subscription = await prisma.subscription.findUnique({
        where: { organizationId }
      });

      logger.info({
        message: 'Subscription fetched',
        context: { userId: user.id, organizationId }
      });

      return NextResponse.json(successResponse(subscription));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch subscription',
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
      const { plan, action } = body;

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Subscription action',
        context: {
          userId: user.id,
          organizationId,
          plan,
          action
        }
      });

      return NextResponse.json(successResponse({
        message: 'Subscription management',
        status: 'coming_soon'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Subscription action failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

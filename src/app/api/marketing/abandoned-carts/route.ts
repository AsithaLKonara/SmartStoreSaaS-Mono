/**
 * Abandoned Carts API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_ABANDONED_CARTS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_CAMPAIGNS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);

      const abandonedCarts = await prisma.cart.findMany({
        where: {
          organizationId: orgId || undefined,
          updatedAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          },
          status: 'ABANDONED'
        },
        take: 100,
        orderBy: { updatedAt: 'desc' }
      });

      logger.info({
        message: 'Abandoned carts fetched',
        context: { userId: user.id, count: abandonedCarts.length }
      });

      return NextResponse.json(successResponse(abandonedCarts));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch abandoned carts',
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
      const { action = 'send_reminder' } = body;

      logger.info({
        message: 'Abandoned cart campaign initiated',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          action
        }
      });

      // TODO: Send abandoned cart reminders
      return NextResponse.json(successResponse({
        action,
        status: 'initiated',
        message: 'Abandoned cart campaign initiated'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Abandoned cart campaign failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

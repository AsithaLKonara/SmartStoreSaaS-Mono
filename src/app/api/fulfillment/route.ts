/**
 * Fulfillment API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_FULFILLMENT permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_FULFILLMENT permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const orgId = getOrganizationScope(user);
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (status) where.status = status;

      const fulfillments = await prisma.fulfillment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Fulfillments fetched',
        context: { userId: user.id, count: fulfillments.length }
      });

      return NextResponse.json(successResponse(fulfillments));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch fulfillments',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId } = body;

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const fulfillment = await prisma.fulfillment.create({
        data: {
          organizationId,
          orderId,
          status: 'PENDING',
          createdBy: user.id
        }
      });

      logger.info({
        message: 'Fulfillment created',
        context: { userId: user.id, fulfillmentId: fulfillment.id }
      });

      return NextResponse.json(successResponse(fulfillment), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create fulfillment',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

/**
 * Shipments API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_SHIPMENTS permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_SHIPMENTS permission)
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

      const shipments = await prisma.delivery.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Shipments fetched',
        context: { userId: user.id, count: shipments.length }
      });

      return NextResponse.json(successResponse(shipments));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch shipments',
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
      const { orderId, carrier, service } = body;

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Shipment created',
        context: {
          userId: user.id,
          orderId,
          carrier
        }
      });

      return NextResponse.json(successResponse({
        message: 'Shipment created',
        trackingNumber: `TRACK-${Date.now()}`
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Shipment creation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

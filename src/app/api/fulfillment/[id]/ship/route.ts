/**
 * Fulfillment Ship API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_FULFILLMENT permission)
 * 
 * Organization Scoping: Validated through fulfillment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const fulfillmentId = params.id;
      const body = await request.json();
      const { trackingNumber, carrier } = body;

      const fulfillment = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId }
      });

      if (!fulfillment) {
        throw new ValidationError('Fulfillment not found');
      }

      if (fulfillment.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot ship fulfillment from other organizations');
      }

      await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: 'SHIPPED',
          shippedBy: user.id,
          shippedAt: new Date(),
          trackingNumber,
          carrier
        }
      });

      logger.info({
        message: 'Fulfillment shipped',
        context: { userId: user.id, fulfillmentId, trackingNumber }
      });

      return NextResponse.json(successResponse({
        message: 'Order shipped successfully',
        fulfillmentId,
        trackingNumber
      }));
    } catch (error: any) {
      logger.error({
        message: 'Fulfillment ship failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


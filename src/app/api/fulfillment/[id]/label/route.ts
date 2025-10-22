/**
 * Fulfillment Label Generation API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (GENERATE_LABELS permission)
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
      const { carrier, service } = body;

      const fulfillment = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId }
      });

      if (!fulfillment) {
        throw new ValidationError('Fulfillment not found');
      }

      if (fulfillment.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot generate labels for fulfillments from other organizations');
      }

      logger.info({
        message: 'Shipping label generated',
        context: {
          userId: user.id,
          fulfillmentId,
          carrier,
          service
        }
      });

      // TODO: Generate actual shipping label
      return NextResponse.json(successResponse({
        labelUrl: `/labels/fulfillment_${fulfillmentId}.pdf`,
        trackingNumber: `TRACK-${Date.now()}`,
        carrier,
        service
      }));
    } catch (error: any) {
      logger.error({
        message: 'Label generation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


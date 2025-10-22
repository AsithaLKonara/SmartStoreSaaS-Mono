/**
 * Fulfillment Pack API Route
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

      const fulfillment = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId }
      });

      if (!fulfillment) {
        throw new ValidationError('Fulfillment not found');
      }

      if (fulfillment.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot pack fulfillment from other organizations');
      }

      await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: 'PACKED',
          packedBy: user.id,
          packedAt: new Date()
        }
      });

      logger.info({
        message: 'Fulfillment items packed',
        context: { userId: user.id, fulfillmentId }
      });

      return NextResponse.json(successResponse({
        message: 'Items packed successfully',
        fulfillmentId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Fulfillment pack failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


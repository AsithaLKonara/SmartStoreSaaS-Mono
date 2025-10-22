/**
 * Shipping Labels API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (CREATE_SHIPPING_LABELS permission)
 * 
 * Organization Scoping: Validated through order
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId, carrier, service } = body;

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new ValidationError('Order not found');
      }

      // Verify order belongs to user's organization
      if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot create labels for orders in other organizations');
      }

      logger.info({
        message: 'Shipping label created',
        context: {
          userId: user.id,
          orderId,
          carrier,
          service
        }
      });

      // TODO: Generate actual shipping label
      return NextResponse.json(successResponse({
        labelUrl: '/labels/mock-label.pdf',
        trackingNumber: `TRACK-${Date.now()}`,
        carrier,
        service
      }));
    } catch (error: any) {
      logger.error({
        message: 'Shipping label creation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

/**
 * Shipping Tracking API Route
 * 
 * Authorization:
 * - GET: Requires authentication (customers can track own shipments)
 * 
 * Customer Scoping: Validated through order ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { sriLankaCourierService } from '@/lib/courier/sriLankaCourierService';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const trackingNumber = searchParams.get('trackingNumber');
      const orderId = searchParams.get('orderId');

      if (!trackingNumber && !orderId) {
        throw new ValidationError('Tracking number or order ID is required');
      }

      let delivery;

      if (trackingNumber) {
        delivery = await prisma.delivery.findFirst({
          where: { trackingNumber },
          include: { courier: true, order: true }
        });
      } else if (orderId) {
        delivery = await prisma.delivery.findFirst({
          where: { orderId },
          include: { courier: true, order: true }
        });
      }

      if (!delivery) {
        // If no delivery record found in DB yet, try to search if tracking number provided (fallback)
        if (trackingNumber) {
          try {
            // Try with default courier
            const trackingInfo = await sriLankaCourierService.trackShipment(trackingNumber, 'courier-1');
            return NextResponse.json(successResponse(trackingInfo));
          } catch (e) {
            // If service fails, throw original error
            throw new ValidationError('Delivery not found');
          }
        }
        throw new ValidationError('Delivery not found');
      }

      // Verify ownership
      if (delivery.order) {
        const order = delivery.order;

        if (user.role === 'CUSTOMER') {
          const customer = await prisma.customer.findFirst({
            where: { email: user.email }
          });
          // If customer record not found, or order doesn't belong to customer
          if (!customer || order.customerId !== customer.id) {
            throw new ValidationError('Cannot track other customers shipments');
          }
        } else if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
          // If user is staff/admin but from different organization
          throw new ValidationError('Cannot track shipments from other organizations');
        }
      }

      if (!delivery.trackingNumber) {
        throw new ValidationError('Tracking number not assigned yet');
      }

      if (!delivery.courierId) {
        throw new ValidationError('Courier ID not assigned yet');
      }

      const trackingInfo = await sriLankaCourierService.trackShipment(delivery.trackingNumber, delivery.courierId);

      return NextResponse.json(successResponse(trackingInfo));
    } catch (error: any) {
      logger.error({
        message: 'Tracking fetch failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

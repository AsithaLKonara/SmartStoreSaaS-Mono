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
import { sriLankaCourierService } from '@/lib/courier/sriLankaCourierService';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { orderId, carrier, service } = body;

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      const orderWithCustomer = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!orderWithCustomer) {
        throw new ValidationError('Order not found');
      }

      const order = orderWithCustomer;

      // Verify order belongs to user's organization
      if (order.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot create labels for orders in other organizations');
      }

      const selectedCarrier = carrier || 'courier-1';

      // Construct shipment request
      const shipmentRequest = {
        pickupAddress: {
          name: 'Warehouse',
          phone: '+94112345678',
          address: '123 Warehouse St',
          city: 'Colombo',
          postalCode: '00100'
        },
        deliveryAddress: {
          name: order.customer?.name || 'Customer',
          phone: order.customer?.phone || '',
          address: 'Customer Address', // Should come from order shipping address JSON
          city: 'City',
          postalCode: '00000'
        },
        package: {
          weight: 1, // Default weight or calculate
          length: 10,
          width: 10,
          height: 10,
          description: `Order #${order.orderNumber}`,
          value: Number(order.total)
        },
        serviceType: service || 'standard',
        paymentMethod: 'prepaid' as const,
        orderId: order.id
      };

      const shipmentResponse = await sriLankaCourierService.createShipment(shipmentRequest, selectedCarrier);

      logger.info({
        message: 'Shipping label created',
        context: {
          userId: user.id,
          orderId,
          carrier: selectedCarrier,
          service: service || 'standard',
          trackingNumber: shipmentResponse.trackingNumber
        }
      });

      return NextResponse.json(successResponse({
        labelUrl: shipmentResponse.labelUrl,
        trackingNumber: shipmentResponse.trackingNumber,
        carrier: selectedCarrier,
        service: service || 'standard',
        estimatedDelivery: shipmentResponse.estimatedDelivery
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

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
import { successResponse, NotFoundError, AuthorizationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, Permission, validateOrganizationAccess, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { sriLankaCourierService } from '@/lib/courier/sriLankaCourierService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fulfillment/[id]/label
 * Generate shipping label
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const correlationId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || uuidv4();
  const resolvedParams = params instanceof Promise ? await params : params;
  const fulfillmentId = resolvedParams.id;

  const handler = requirePermission(Permission.INVENTORY_MANAGE)(
    async (req: AuthenticatedRequest, user) => {
      try {
        let body: any = {};
        try { body = await req.json(); } catch (e) { }
        const { carrier, service } = body;

        // Fetch fulfillment with order details to get shipping address
        const fulfillmentWithOrder = await prisma.fulfillment.findUnique({
          where: { id: fulfillmentId },
          include: {
            order: {
              include: {
                customer: true
              }
            }
          }
        });

        if (!fulfillmentWithOrder) {
          throw new NotFoundError('Fulfillment not found');
        }

        const fulfillment = fulfillmentWithOrder;

        if (!validateOrganizationAccess(user, fulfillment.organizationId)) {
          throw new AuthorizationError('Cannot generate labels for fulfillments from other organizations');
        }

        // Use provided carrier or default
        const selectedCarrier = carrier || 'courier-1'; // Default to first available if not specified

        // Construct shipment request
        const shipmentRequest = {
          pickupAddress: {
            name: 'Warehouse', // Should come from warehouse details
            phone: '+94112345678',
            address: '123 Warehouse St',
            city: 'Colombo',
            postalCode: '00100'
          },
          deliveryAddress: {
            name: fulfillment.order.customer?.name || 'Customer',
            phone: fulfillment.order.customer?.phone || '',
            address: 'Customer Address', // Should come from order shipping address JSON
            city: 'City',
            postalCode: '00000'
          },
          package: {
            weight: 1, // Should come from fulfillment items weight
            length: 10,
            width: 10,
            height: 10,
            description: `Order #${fulfillment.order.orderNumber}`,
            value: Number(fulfillment.order.total)
          },
          serviceType: service || 'standard',
          paymentMethod: 'prepaid' as const,
          orderId: fulfillment.orderId
        };

        // Generate label using courier service
        const shipmentResponse = await sriLankaCourierService.createShipment(shipmentRequest, selectedCarrier);

        logger.info({
          message: 'Shipping label generated',
          context: {
            userId: user.id,
            fulfillmentId,
            carrier: selectedCarrier,
            trackingNumber: shipmentResponse.trackingNumber,
            organizationId: fulfillment.organizationId
          },
          correlation: correlationId
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
          message: 'Label generation failed',
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            path: req.nextUrl.pathname,
            userId: user.id,
            organizationId: user.organizationId,
            fulfillmentId
          },
          correlation: correlationId
        });

        if (error instanceof NotFoundError || error instanceof AuthorizationError) {
          throw error;
        }

        return NextResponse.json({
          success: false,
          code: 'ERR_INTERNAL',
          message: 'Failed to generate shipping label',
          correlation: correlationId
        }, { status: 500 });
      }
    }
  );

  return handler(request);
}


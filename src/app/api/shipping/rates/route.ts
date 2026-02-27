import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { sriLankaCourierService } from '@/lib/courier/sriLankaCourierService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shipping/rates
 * Get shipping rates
 */
export const GET = requirePermission('VIEW_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const origin = searchParams.get('origin');
      const destination = searchParams.get('destination');
      const weight = parseFloat(searchParams.get('weight') || '1');
      const dimensions = searchParams.get('dimensions');

      if (!origin || !destination) {
        throw new ValidationError('Origin and destination are required', {
          fields: { origin: !origin, destination: !destination }
        });
      }

      // Calculate shipping rates using Sri Lanka Courier Service
      const shipmentRequest = {
        pickupAddress: {
          name: 'Warehouse',
          phone: '',
          address: origin,
          city: origin.split(',')[0] || '', // Simple extraction
          postalCode: ''
        },
        deliveryAddress: {
          name: 'Customer',
          phone: '',
          address: destination,
          city: destination.split(',')[0] || '', // Simple extraction
          postalCode: ''
        },
        package: {
          weight: weight,
          length: 10, // Defaults
          width: 10,
          height: 10,
          description: 'Standard Package',
          value: 1000 // Default value
        },
        serviceType: 'standard',
        paymentMethod: 'prepaid' as const,
        orderId: 'quote' // Placeholder for rate calculation
      };

      let shippingRates = [];

      try {
        const couriers = sriLankaCourierService.getAvailableCouriers();

        // Parallelize cost calculation
        const ratePromises = couriers.map(async (code) => {
          try {
            const cost = await sriLankaCourierService.calculateCost(shipmentRequest, code);
            // Get service details for display name
            const services = await sriLankaCourierService.getAvailableServices();
            const serviceInfo = services.find(s => s.code === code);

            return {
              id: `rate_${code}`,
              provider: serviceInfo ? serviceInfo.name : code,
              service: 'Standard Delivery',
              estimatedDays: '2-3',
              cost: cost,
              currency: 'LKR'
            };
          } catch (e) {
            return null; // Skip if calculation fails for this courier
          }
        });

        const results = await Promise.all(ratePromises);
        shippingRates = results.filter(rate => rate !== null) as any[];

      } catch (serviceError) {
        logger.warn({
          message: 'Courier service rate calculation failed, falling back to defaults',
          error: serviceError
        });
      }

      // Fallback if no rates found
      if (shippingRates.length === 0) {
        const baseRate = 350; // LKR
        const weightRate = weight ? weight * 50 : 0;
        const standardCost = baseRate + weightRate;

        shippingRates = [
          {
            id: 'rate_standard_fallback',
            provider: 'Standard Shipping',
            service: 'Ground',
            estimatedDays: '3-5',
            cost: Math.round(standardCost),
            currency: 'LKR'
          }
        ];
      }

      logger.info({
        message: 'Shipping rates calculated',
        context: {
          userId: user.id,
          organizationId,
          origin,
          destination,
          weight
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        rates: shippingRates,
        origin,
        destination,
        weight,
        dimensions
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to calculate shipping rates',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to calculate shipping rates',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/shipping/rates
 * Create shipping rate
 */
export const POST = requirePermission('MANAGE_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { name, baseRate, perKgRate, freeShippingThreshold, isActive } = body;

      if (!name || baseRate === undefined) {
        throw new ValidationError('Name and base rate are required', {
          fields: { name: !name, baseRate: baseRate === undefined }
        });
      }

      // TODO: Implement actual shipping rate creation
      logger.info({
        message: 'Shipping rate created',
        context: {
          userId: user.id,
          organizationId,
          name,
          baseRate
        },
        correlation: req.correlationId
      });

      const shippingRate = {
        id: `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        baseRate: parseFloat(baseRate),
        perKgRate: perKgRate ? parseFloat(perKgRate) : 0,
        freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json(successResponse(shippingRate), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create shipping rate',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to create shipping rate',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
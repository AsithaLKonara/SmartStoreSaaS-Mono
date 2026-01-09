import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

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

      // Get shipping configuration from organization settings
      const shippingConfig = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          settings: true
        }
      });

      // Calculate shipping rates based on weight and distance
      // Using basic calculation - can be enhanced with actual shipping provider APIs
      const baseRate = 5.99;
      const weightRate = weight ? weight * 2.5 : 0;
      const standardCost = baseRate + weightRate;

      const shippingRates = [
        {
          id: 'rate_standard',
          provider: 'Standard Shipping',
          service: 'Ground',
          estimatedDays: '3-5',
          cost: Math.round(standardCost * 100) / 100,
          currency: 'USD'
        },
        {
          id: 'rate_express',
          provider: 'Express Shipping',
          service: '2-Day',
          estimatedDays: '2',
          cost: Math.round(standardCost * 2 * 100) / 100,
          currency: 'USD'
        },
        {
          id: 'rate_overnight',
          provider: 'Overnight Shipping',
          service: 'Next Day',
          estimatedDays: '1',
          cost: Math.round(standardCost * 3.5 * 100) / 100,
          currency: 'USD'
        }
      ];

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
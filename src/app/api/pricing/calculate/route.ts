/**
 * Pricing Calculation API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * 
 * Calculates pricing with discounts and taxes
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { PricingService } from '@/lib/services/pricing.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pricing/calculate
 * Calculate pricing with discounts and taxes
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { items, customerId, couponCode } = body;

      if (!items || !Array.isArray(items)) {
        throw new ValidationError('Items array is required', {
          fields: { items: !items || !Array.isArray(items) }
        });
      }

      const result = await PricingService.calculateOrderPricing({
        items,
        customerId,
        couponCode,
        organizationId: user.organizationId!
      });

      logger.info({
        message: 'Pricing calculated via Service',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          itemCount: items.length,
          total: result.total
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        subtotal: result.subtotal,
        tax: result.tax,
        discount: result.discount,
        total: result.total,
        currency: result.currency,
        message: 'Pricing calculated'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Pricing calculation failed',
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
        message: 'Pricing calculation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);


/**
 * Payment Intent API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (CREATE_ORDERS permission for payment processing)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { logger } from '@/lib/logger';
import { stripeService } from '@/lib/payments/stripeService';
import { AuditService } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/intent
 * Create payment intent
 */
export const POST = requirePermission('CREATE_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { amount, currency = 'usd', orderId, customerId, metadata = {} } = body;

      // Validate required fields
      if (!amount || amount <= 0) {
        throw new ValidationError('Valid amount is required');
      }

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      logger.info({
        message: 'Payment intent requested (generic)',
        context: { userId: user.id, orderId, amount, currency }
      });

      // Create actual Stripe intent
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency,
        undefined, // Stripe Customer ID
        {
          orderId,
          userId: user.id,
          organizationId,
          ...metadata
        }
      );

      // Audit log the creation
      await AuditService.log({
        userId: user.id,
        organizationId,
        action: 'CREATE_PAYMENT_INTENT',
        resource: 'PAYMENT',
        resourceId: paymentIntent.id,
        details: { orderId, amount, currency, provider: 'stripe' }
      });

      return NextResponse.json(successResponse({
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        provider: 'stripe'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to create payment intent',
        error: error instanceof Error ? error.message : String(error),
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
        message: 'Failed to create payment intent',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
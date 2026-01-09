/**
 * PayHere Payment Initiation API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER (CREATE_ORDERS permission for payment processing)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/payhere/initiate
 * Initiate PayHere payment
 */
export const POST = requirePermission('CREATE_ORDERS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { amount, currency = 'LKR', orderId, customerId, customerName, customerEmail, customerPhone } = body;

      // Validate required fields
      if (!amount || amount <= 0) {
        throw new ValidationError('Valid amount is required');
      }

      if (!orderId) {
        throw new ValidationError('Order ID is required');
      }

      // TODO: Implement actual PayHere payment initiation
      // This would typically involve:
      // 1. Validating order and customer data
      // 2. Creating payment request with PayHere API
      // 3. Storing payment record in database
      // 4. Returning payment URL for redirection

      const paymentRequest = {
        id: `payhere_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase(),
        customerId: customerId || user.id,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || 'customer@example.com',
        customerPhone: customerPhone || '+94123456789',
        status: 'pending',
        organizationId,
        paymentUrl: `https://sandbox.payhere.lk/pay/checkout?merchant_id=TEST_MERCHANT_ID&order_id=${orderId}&amount=${amount}&currency=${currency}`,
        createdAt: new Date().toISOString()
      };

      logger.info({
        message: 'PayHere payment initiated',
        context: {
          userId: user.id,
          amount,
          currency,
          orderId,
          customerId,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(paymentRequest));
    } catch (error: any) {
      logger.error({
        message: 'Failed to initiate PayHere payment',
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
        message: 'Failed to initiate PayHere payment',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
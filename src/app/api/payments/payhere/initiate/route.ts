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
import { payHereService } from '@/lib/payments/payhereService';
import { AuditService } from '@/lib/audit';

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

      // Use PayHereService to create request params
      const paymentParams = await payHereService.createPaymentRequest({
        orderId,
        amount,
        currency: currency.toUpperCase(),
        firstName: customerName?.split(' ')[0] || 'Customer',
        lastName: customerName?.split(' ').slice(1).join(' ') || '',
        email: customerEmail || 'customer@example.com',
        phone: customerPhone || '+94000000000',
        address: 'N/A', // Address might be needed to be passed from frontend
        city: 'Colombo',
        country: 'Sri Lanka'
      }, organizationId);

      // Audit log
      await AuditService.log({
        userId: user.id,
        organizationId,
        action: 'INITIATE_PAYMENT',
        resource: 'PAYMENT_REQUEST',
        resourceId: orderId,
        details: { provider: 'payhere', amount, currency }
      });

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

      return NextResponse.json(successResponse(paymentParams));



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
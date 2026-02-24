import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { PayPalService } from '@/lib/payments/paypalService';
import { AuditService } from '@/lib/audit';

const paypalService = new PayPalService();

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/paypal/create-order
 * Create a PayPal order
 */
export const POST = requireAuth(
    async (request, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                throw new ValidationError('User must belong to an organization');
            }

            const body = await request.json();
            const { amount, currency = 'USD', orderId, returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/payment/success`, cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/payment/cancel` } = body;

            if (!amount || !orderId) {
                throw new ValidationError('Amount and Order ID are required');
            }

            logger.info({
                message: 'PayPal order creation requested',
                context: { userId: user.id, orderId, amount }
            });

            // Create PayPal order
            const paypalOrder = await paypalService.createOrder(amount, currency, orderId, returnUrl, cancelUrl);

            // Audit log
            await AuditService.log({
                userId: user.id,
                organizationId,
                action: 'CREATE_PAYPAL_ORDER',
                resource: 'PAYMENT',
                resourceId: paypalOrder.id,
                details: { orderId, amount, currency }
            });

            return NextResponse.json(successResponse({
                orderId: paypalOrder.id,
                status: paypalOrder.status,
                links: paypalOrder.links
            }));
        } catch (error: any) {
            logger.error({
                message: 'PayPal order creation failed',
                error: error instanceof Error ? error.message : String(error),
                context: { userId: user.id }
            });

            return NextResponse.json({
                success: false,
                message: error.message || 'Failed to create PayPal order'
            }, { status: 500 });
        }
    }
);

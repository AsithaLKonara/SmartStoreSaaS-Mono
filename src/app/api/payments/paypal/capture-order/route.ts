import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { PayPalService } from '@/lib/payments/paypalService';
import { AuditService } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

const paypalService = new PayPalService();

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/paypal/capture-order
 * Capture a PayPal order (finalize payment)
 */
export const POST = requireAuth(
    async (request, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                throw new ValidationError('User must belong to an organization');
            }

            const body = await request.json();
            const { paypalOrderId, orderId } = body;

            if (!paypalOrderId || !orderId) {
                throw new ValidationError('PayPal Order ID and System Order ID are required');
            }

            logger.info({
                message: 'PayPal order capture requested',
                context: { userId: user.id, paypalOrderId, orderId }
            });

            // Capture PayPal order
            const captureData = await paypalService.captureOrder(paypalOrderId);

            if (captureData.status === 'COMPLETED') {
                // Fetch order details for organization ID
                const order = await prisma.order.findUnique({
                    where: { id: orderId }
                });

                if (!order) {
                    throw new ValidationError('Order not found');
                }

                // Create Payment record
                // Note: The service already updates the order status to CONFIRMED
                await prisma.payment.create({
                    data: {
                        orderId,
                        organizationId: order.organizationId,
                        amount: parseFloat(captureData.amount.total), // Convert string to number/decimal
                        currency: captureData.amount.currency,
                        method: 'PAYPAL',
                        status: 'PAID', // Use enum value
                        transactionId: captureData.id,
                        gateway: 'paypal',
                        metadata: {
                            paypalOrderId,
                            captureId: captureData.id,
                            payerEmail: captureData.payer.payer_info.email
                        }
                    }
                });

                // Ensure order is processed (redundant safety check)
                if (order.status !== 'PROCESSING') {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: 'PROCESSING',
                            paypalOrderId
                        }
                    });
                }



                // Audit log
                await AuditService.log({
                    userId: user.id,
                    organizationId,
                    action: 'CAPTURE_PAYPAL_ORDER',
                    resource: 'PAYMENT',
                    resourceId: paypalOrderId,
                    details: { orderId, status: 'COMPLETED' }
                });

                return NextResponse.json(successResponse({
                    status: 'COMPLETED',
                    captureId: captureData.id
                }));
            } else {
                return NextResponse.json({
                    success: false,
                    message: `Payment status: ${captureData.status}`,
                    status: captureData.status
                }, { status: 400 });
            }
        } catch (error: any) {
            logger.error({
                message: 'PayPal order capture failed',
                error: error instanceof Error ? error.message : String(error),
                context: { userId: user.id }
            });

            return NextResponse.json({
                success: false,
                message: error.message || 'Failed to capture PayPal order'
            }, { status: 500 });
        }
    }
);

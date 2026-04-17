import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import * as crypto from 'crypto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface PayHereConfig {
    merchantId: string;
    merchantSecret: string;
    environment: 'sandbox' | 'production';
}

interface PayHereInitParams {
    orderId: string;
    amount: number;
    currency: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
}

export class PayHereService {
    private config: PayHereConfig;
    private baseUrl: string;

    constructor() {
        this.config = {
            merchantId: process.env.PAYHERE_MERCHANT_ID || '1211149', // Default mock ID
            merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || 'secret',
            environment: (process.env.PAYHERE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
        };

        this.baseUrl = this.config.environment === 'sandbox'
            ? 'https://sandbox.payhere.lk/pay/checkout'
            : 'https://www.payhere.lk/pay/checkout';
    }

    /**
     * Generate MD5 hash for PayHere signature
     * md5(merchant_id + order_id + amount + currency + status_code + md5(merchant_secret).toUpperCase()).toUpperCase()
     * status_code is only used for return/notify, for init it is slightly different logic but we mostly need this for validation
     */
    generateSignature(orderId: string, amount: number, currency: string, statusCode?: string): string {
        const amountFormatted = amount.toFixed(2); // Amount must be formatted to 2 decimal places
        const merchantSecretHash = crypto.createHash('md5')
            .update(this.config.merchantSecret)
            .digest('hex')
            .toUpperCase();

        let stringToHash = '';

        if (statusCode) {
            // Validation signature
            stringToHash = `${this.config.merchantId}${orderId}${amountFormatted}${currency}${statusCode}${merchantSecretHash}`;
        } else {
            // Initiation signature (if required by frontend, but usually generated there or here)
            // md5(merchant_id + order_id + amount + currency + md5(merchant_secret))
            stringToHash = `${this.config.merchantId}${orderId}${amountFormatted}${currency}${merchantSecretHash}`;
        }

        return crypto.createHash('md5').update(stringToHash).digest('hex').toUpperCase();
    }

    /**
     * Configure payment parameters for frontend form
     */
    async createPaymentRequest(params: PayHereInitParams, organizationId: string) {
        const { orderId, amount, currency } = params;

        try {
            // Create a pending payment record
            await prisma.payment.create({
                data: {
                    orderId,
                    organizationId,
                    amount,
                    currency,
                    method: 'PAYHERE',
                    status: 'PENDING',
                    gateway: 'payhere',
                    metadata: {
                        initiatedAt: new Date().toISOString()
                    }
                }
            });

            const hash = this.generateSignature(orderId, amount, currency);

            return {
                merchant_id: this.config.merchantId,
                return_url: `${process.env.NEXTAUTH_URL}/payments/payhere/return`,
                cancel_url: `${process.env.NEXTAUTH_URL}/payments/payhere/cancel`,
                notify_url: `${process.env.NEXTAUTH_URL}/api/payments/payhere/notify`,
                order_id: orderId,
                items: `Order #${orderId}`,
                currency,
                amount: amount.toFixed(2),
                first_name: params.firstName,
                last_name: params.lastName,
                email: params.email,
                phone: params.phone,
                address: params.address,
                city: params.city,
                country: params.country,
                custom_1: organizationId,
                hash,
                action_url: this.baseUrl
            };
        } catch (error) {
            logger.error({
                message: 'Failed to create PayHere request',
                error: error instanceof Error ? error.message : String(error),
                context: { orderId }
            });
            throw error;
        }
    }

    /**
     * Validate and process PayHere notification
     */
    async processNotification(data: any) {
        const {
            merchant_id,
            order_id,
            payment_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig
        } = data;

        // 1. Validate Merchant ID
        if (merchant_id !== this.config.merchantId) {
            throw new Error('Invalid Merchant ID');
        }

        // 2. Validate Signature
        const localSig = this.generateSignature(
            order_id,
            parseFloat(payhere_amount),
            payhere_currency,
            status_code
        );

        if (localSig !== md5sig) {
            throw new Error('Invalid Signature');
        }

        // 3. Update Payment/Order Status
        // Status 2 is Success
        const status = status_code === '2' ? PaymentStatus.PAID : PaymentStatus.FAILED;
        const orderStatus = status_code === '2' ? OrderStatus.PROCESSING : OrderStatus.CANCELLED;

        await prisma.$transaction([
            prisma.payment.updateMany({
                where: { 
                    orderId: order_id, 
                    method: 'PAYHERE',
                    organizationId: data.custom_1 
                },
                data: {
                    status,
                    transactionId: payment_id,
                    metadata: {
                        payhere_status: status_code,
                        payhere_payment_id: payment_id
                    }
                }
            }),
            prisma.order.update({
                where: { id: order_id, organizationId: data.custom_1 },
                data: {
                    status: orderStatus,
                }
            })
        ]);

        return { success: true, status };
    }
}

export const payHereService = new PayHereService();

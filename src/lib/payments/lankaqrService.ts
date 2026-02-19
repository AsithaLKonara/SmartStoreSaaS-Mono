import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { QRCodeSVG } from 'qrcode.react'; // Not using this in backend, just generating string

interface LankaQRPayload {
    merchantId: string;
    merchantName: string;
    merchantCity: string;
    amount?: number;
    currency?: string; // "144" for LKR
    reference?: string;
    terminalId?: string;
    billNumber?: string;
}

export class LankaQRService {
    /**
     * Generate LankaQR string (EMVCo Compatible)
     * Note: This is a simplified generator. A full implementation requires proper TLV encoding.
     */
    static generateQRString(payload: LankaQRPayload): string {
        // Mock implementation of EMVCo QR String generation
        // In a real scenario, use a library like 'emv-qrcode'

        const { merchantId, amount, reference } = payload;

        // Simplified structure
        // 00: Format Indicator
        // 01: Initiation Method (11: Static, 12: Dynamic)
        // 26: Merchant Account Information (VISA/Mastercard/LankaQR)
        // 52: Merchant Category Code
        // 53: Currency (144 for LKR)
        // 54: Transaction Amount
        // 58: Country Code (LK)
        // 59: Merchant Name
        // 60: Merchant City
        // 62: Additional Data (Bill Number/Reference)
        // 63: CRC

        // For now returning a mock string that resembles a QR payload
        const qrString = `00020101021226240018${merchantId}52040000530314454${amount ? amount.toFixed(2).length.toString().padStart(2, '0') + amount.toFixed(2) : '00'}5802LK59${payload.merchantName.length.toString().padStart(2, '0')}${payload.merchantName}60${payload.merchantCity.length.toString().padStart(2, '0')}${payload.merchantCity}62${reference ? reference.length.toString().padStart(2, '0') + reference : '040000'}6304ABCD`;

        return qrString;
    }

    /**
     * Create a QR payment request for an order
     */
    static async createPaymentRequest(orderId: string, organizationId: string, amount: number) {
        try {
            // Get organization merchant details (Mock or from config/DB)
            const merchantDetails = {
                id: 'LANKAQR001',
                name: 'SmartStore Merchant',
                city: 'Colombo'
            };

            const qrString = this.generateQRString({
                merchantId: merchantDetails.id,
                merchantName: merchantDetails.name,
                merchantCity: merchantDetails.city,
                amount,
                reference: orderId,
                currency: '144' // LKR
            });

            // Save payment intent/request in DB
            const payment = await prisma.payment.create({
                data: {
                    orderId,
                    organizationId,
                    amount,
                    currency: 'LKR',
                    method: 'LANKAQR',
                    status: 'PENDING',
                    gateway: 'lankaqr',
                    metadata: {
                        qrString,
                        generatedAt: new Date().toISOString()
                    }
                }
            });

            return {
                paymentId: payment.id,
                qrString,
                amount,
                currency: 'LKR'
            };

        } catch (error) {
            logger.error({
                message: 'Failed to generate LankaQR',
                error: error instanceof Error ? error.message : String(error),
                context: { orderId, amount }
            });
            throw error;
        }
    }
}

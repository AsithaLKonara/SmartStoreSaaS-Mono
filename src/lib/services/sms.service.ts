import { logger } from '@/lib/logger';

export class SmsService {
    /**
     * Send an OTP via SMS
     */
    static async sendOTP(phone: string, otp: string) {
        logger.info({
            message: 'Sending SMS OTP',
            context: { phone, otpLength: otp.length }
        });

        // Placeholder for Twilio / MessageBird / local provider
        // Integration would happen here using fetch() or a client SDK

        return {
            success: true,
            provider: 'MockSmsGateway',
            messageId: `sms_${Date.now()}`
        };
    }

    /**
     * Send general SMS
     */
    static async sendSMS(phone: string, message: string) {
        logger.info({
            message: 'Sending SMS',
            context: { phone, messageLength: message.length }
        });

        return {
            success: true,
            provider: 'MockSmsGateway',
            messageId: `sms_${Date.now()}`
        };
    }
}

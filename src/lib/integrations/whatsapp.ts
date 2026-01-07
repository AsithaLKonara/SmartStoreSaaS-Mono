import twilio from 'twilio';
import { logger } from '../logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// Initialize Twilio client (lazy initialization to avoid build errors)
let client: any = null;

function getTwilioClient() {
  if (client) return client;
  
  // Only initialize if we have valid credentials (accountSid starts with AC)
  if (accountSid && authToken && accountSid.startsWith('AC')) {
    client = twilio(accountSid, authToken);
  }
  
  return client;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  data: WhatsAppMessage
): Promise<WhatsAppResponse> {
  try {
    const twilioClient = getTwilioClient();
    
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    // Format phone number for WhatsApp
    const toNumber = data.to.startsWith('whatsapp:') 
      ? data.to 
      : `whatsapp:${data.to}`;

    // Send message
    const message = await twilioClient.messages.create({
      from: whatsappNumber,
      to: toNumber,
      body: data.message,
      ...(data.mediaUrl && { mediaUrl: [data.mediaUrl] }),
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    logger.error({
      message: 'WhatsApp send error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'WhatsAppIntegration', operation: 'sendMessage', to, message }
    });
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Verify WhatsApp connection
 */
export async function verifyWhatsAppConnection(): Promise<boolean> {
  try {
    if (!client) {
      return false;
    }

    // Try to fetch account info
    const account = await client.api.accounts(accountSid).fetch();
    return account.status === 'active';
  } catch (error) {
    logger.error({
      message: 'WhatsApp verification error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'WhatsAppIntegration', operation: 'verifyAccount' }
    });
    return false;
  }
}

/**
 * Get WhatsApp message status
 */
export async function getMessageStatus(messageSid: string) {
  try {
    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const message = await client.messages(messageSid).fetch();
    return {
      success: true,
      status: message.status,
      error: message.errorMessage,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}


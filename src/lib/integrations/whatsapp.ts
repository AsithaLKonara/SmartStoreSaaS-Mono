import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// Initialize Twilio client
let client: any = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
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
    if (!client) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    // Format phone number for WhatsApp
    const toNumber = data.to.startsWith('whatsapp:') 
      ? data.to 
      : `whatsapp:${data.to}`;

    // Send message
    const message = await client.messages.create({
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
    console.error('WhatsApp send error:', error);
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
    console.error('WhatsApp verification error:', error);
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


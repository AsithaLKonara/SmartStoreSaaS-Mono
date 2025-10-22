import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Lazy Twilio client initialization to avoid build errors
let client: any = null;

function getTwilioClient() {
  if (client) return client;
  
  // Only initialize if we have valid credentials (accountSid starts with AC)
  if (accountSid && authToken && accountSid.startsWith('AC')) {
    client = twilio(accountSid, authToken);
  }
  
  return client;
}

export interface SMSMessage {
  to: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(data: SMSMessage): Promise<SMSResponse> {
  try {
    const twilioClient = getTwilioClient();
    
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    if (!phoneNumber) {
      throw new Error('Twilio phone number not configured.');
    }

    // Format phone number
    const toNumber = data.to.startsWith('+') ? data.to : `+${data.to}`;

    // Send SMS
    const message = await twilioClient.messages.create({
      from: phoneNumber,
      to: toNumber,
      body: data.message,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(messages: SMSMessage[]): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  results: SMSResponse[];
}> {
  const results: SMSResponse[] = [];
  let sent = 0;
  let failed = 0;

  for (const message of messages) {
    const result = await sendSMS(message);
    results.push(result);
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    
    // Add small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    success: failed === 0,
    sent,
    failed,
    results,
  };
}

/**
 * Get SMS status
 */
export async function getSMSStatus(messageSid: string) {
  try {
    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const message = await client.messages(messageSid).fetch();
    return {
      success: true,
      status: message.status,
      error: message.errorMessage,
      price: message.price,
      direction: message.direction,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
  return sendSMS({
    to: phoneNumber,
    message: `Your SmartStore verification code is: ${otp}. Valid for 10 minutes.`,
  });
}

/**
 * Send order notification via SMS
 */
export async function sendOrderNotification(
  phoneNumber: string,
  orderNumber: string,
  status: string
): Promise<SMSResponse> {
  return sendSMS({
    to: phoneNumber,
    message: `Your order ${orderNumber} status: ${status}. Thank you for shopping with SmartStore!`,
  });
}

/**
 * Send delivery notification via SMS
 */
export async function sendDeliveryNotification(
  phoneNumber: string,
  orderNumber: string,
  trackingNumber: string
): Promise<SMSResponse> {
  return sendSMS({
    to: phoneNumber,
    message: `Your order ${orderNumber} is out for delivery. Tracking: ${trackingNumber}. Track at: https://smartstore-demo.vercel.app/track/${trackingNumber}`,
  });
}


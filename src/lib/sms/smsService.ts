import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { smsLogger } from '@/lib/utils/logger';

// Lazy Twilio client initialization (to avoid build errors with invalid credentials)
let twilioClient: any = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  
  // Only initialize if we have valid credentials (accountSid must start with AC)
  if (sid && token && sid.startsWith('AC')) {
    twilioClient = twilio(sid, token);
  }
  
  return twilioClient;
}

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
  mediaUrl?: string[];
  scheduledTime?: Date;
  campaignId?: string;
}

export interface BulkSMSOptions {
  recipients: Array<{
    phone: string;
    message: string;
    variables?: Record<string, unknown>;
  }>;
  from?: string;
  scheduledTime?: Date;
  campaignId?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export interface SMSAnalytics {
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
  deliveryRate: number;
  clickRate: number;
}

export type SendSMSParams = {
  to: string;
  body: string;
};

export class SMSService {
  private provider: 'twilio' | 'aws-sns' = 'twilio';

  constructor() {
    this.provider = (process.env.SMS_PROVIDER as 'twilio' | 'aws-sns') || 'twilio';
  }

  private getClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio configuration missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
    }
    
    // Validate format before initializing to avoid build errors
    if (!accountSid.startsWith('AC')) {
      throw new Error('Invalid Twilio Account SID format (must start with AC)');
    }
    
    // Lazy import to avoid bundling twilio SDK in edge by default
    // @ts-ignore - Dynamic require for Twilio SDK
    const twilio = require('twilio');
    return twilio(accountSid, authToken);
  }

  async sendSMS(params: SendSMSParams): Promise<{ sid: string }> {
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) {
      throw new Error('TWILIO_PHONE_NUMBER is not set');
    }

    const client = this.getClient();
    const message = await client.messages.create({
      to: params.to,
      from,
      body: params.body,
    });

    return { sid: message.sid };
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(options: BulkSMSOptions): Promise<{ success: boolean; results: unknown[]; error?: string }> {
    try {
      const results = [];

      for (const recipient of options.recipients) {
        const result = await this.sendSMS({
          to: recipient.phone,
          message: this.processTemplate(recipient.message, recipient.variables || {}),
          from: options.from,
          scheduledTime: options.scheduledTime,
          campaignId: options.campaignId,
        });

        results.push({
          phone: recipient.phone,
          ...result,
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      smsLogger.error('Error sending bulk SMS', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, results: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create SMS template
   */
  async createTemplate(template: Omit<SMSTemplate, 'id'>): Promise<SMSTemplate> {
    try {
      const createdTemplate = await prisma.smsTemplate.create({
        data: {
          name: template.name,
          content: template.content,
          variables: template.variables,
          organization: {
            connect: {
              id: process.env.DEFAULT_ORGANIZATION_ID || 'default'
            }
          }
        },
      });

      return {
        id: createdTemplate.id,
        name: createdTemplate.name,
        content: createdTemplate.content,
        variables: createdTemplate.variables,
      };
    } catch (error) {
      smsLogger.error('Error creating SMS template', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to create SMS template');
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(orderId: string, customerPhone: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const message = `Hi ${order.customer.name}! Your order #${order.id} has been confirmed. Total: $${order.totalAmount}. Track your order at: ${process.env.NEXTAUTH_URL}/orders/${order.id}`;

      await this.sendSMS({
        to: customerPhone,
        message,
        campaignId: 'order-confirmation',
      });
    } catch (error) {
      smsLogger.error('Error sending order confirmation SMS', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async sendShippingNotification(orderId: string, trackingNumber: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const message = `Your order #${order.id} has shipped! Track it with: ${trackingNumber} at ${process.env.TRACKING_URL}/${trackingNumber}`;

    await this.sendSMS({
      to: order.customer.phone || '',
      message,
    });
  }

  async sendDeliveryNotification(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const message = `Great news! Your order #${order.id} has been delivered. Thank you for choosing SmartStore AI!`;

    await this.sendSMS({
      to: order.customer.phone || '',
      message,
    });
  }

  async sendOTPCode(phone: string, code: string): Promise<void> {
    const message = `Your SmartStore AI verification code is: ${code}. This code expires in 5 minutes.`;

    await this.sendSMS({
      to: phone,
      message,
    });
  }

  async sendPasswordReset(phone: string, resetCode: string): Promise<void> {
    const message = `Your password reset code is: ${resetCode}. Use this code to reset your SmartStore AI password. Expires in 10 minutes.`;

    await this.sendSMS({
      to: phone,
      message,
    });
  }

  async sendLowStockAlert(productName: string, currentStock: number, adminPhones: string[]): Promise<void> {
    const message = `⚠️ LOW STOCK ALERT: ${productName} has only ${currentStock} units remaining. Please restock soon.`;

    for (const phone of adminPhones) {
      await this.sendSMS({
        to: phone,
        message,
      });
    }
  }

  async sendPaymentReminder(orderId: string, amount: number, customerPhone: string): Promise<void> {
    const message = `Payment reminder: Your order #${orderId} payment of $${amount} is due. Pay now at: ${process.env.NEXTAUTH_URL}/orders/${orderId}/pay`;

    await this.sendSMS({
      to: customerPhone,
      message,
    });
  }

  /**
   * Send marketing SMS campaigns
   */
  async sendCampaign(campaignId: string): Promise<{ success: boolean; recipientCount: number }> {
    try {
      const campaign = await prisma.smsCampaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
          segments: {
            include: {
              customerSegment: {
                include: {
                  customerSegmentCustomers: {
                    include: {
                      customer: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!campaign || !campaign.template) {
        throw new Error('Campaign or template not found');
      }

      const recipients = campaign.segments.flatMap((segment: unknown) =>
        segment.customerSegment.customerSegmentCustomers.map((sub: unknown) => ({
          phone: sub.customer.phone!,
          customerId: sub.customer.id,
        }))
      );

      const message = campaign.template.content;

      // Send SMS to all recipients
      const results = await Promise.allSettled(
        recipients.map((recipient: unknown) =>
          this.sendSMS({
            to: recipient.phone,
            message,
            campaignId,
          })
        )
      );

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      // Update campaign status
      await prisma.smsCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return {
        success: successCount > 0,
        recipientCount: recipients.length,
      };
    } catch (error) {
      smsLogger.error('Error sending SMS campaign', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, recipientCount: 0 };
    }
  }

  /**
   * Handle incoming SMS
   */
  async handleIncomingMessage(from: string, body: string, messageId: string): Promise<void> {
    try {
      // Log incoming message
      await prisma.smsLog.create({
        data: {
          phone: from,
          message: body,
          status: 'delivered',
          provider: 'twilio',
          messageId,
          organization: {
            connect: {
              id: process.env.DEFAULT_ORGANIZATION_ID || 'default'
            }
          }
        },
      });

      // Process auto-reply
      await this.processAutoReply(from, body);

      // Check if it's a customer service request
      if (this.isCustomerServiceKeyword(body)) {
        await this.triggerCustomerServiceWorkflow(from, body);
      }
    } catch (error) {
      smsLogger.error('Error handling incoming SMS', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async processAutoReply(phone: string, message: string): Promise<void> {
    const autoReplies = [
      { keywords: ['stop', 'unsubscribe'], reply: 'You have been unsubscribed from SMS notifications. Reply START to re-subscribe.' },
      { keywords: ['start', 'subscribe'], reply: 'You have been subscribed to SMS notifications. Reply STOP to unsubscribe.' },
      { keywords: ['help', 'info'], reply: 'SmartStore AI Support. For help, visit our website or call customer service.' },
      { keywords: ['status', 'order'], reply: 'To check your order status, please visit our website or provide your order number.' },
    ];

    for (const autoReply of autoReplies) {
      if (autoReply.keywords.some(keyword => message.includes(keyword))) {
        await this.sendSMS({
          to: phone,
          message: autoReply.reply,
        });
        break;
      }
    }
  }

  private isCustomerServiceKeyword(message: string): boolean {
    const serviceKeywords = ['help', 'support', 'problem', 'issue', 'complaint', 'refund', 'return'];
    return serviceKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Trigger customer service workflow
   */
  private async triggerCustomerServiceWorkflow(phone: string, message: string): Promise<void> {
    try {
      // Create support ticket
      await prisma.supportTicket.create({
        data: {
          title: `SMS Support Request from ${phone}`,
          description: message,
          priority: 'medium',
          status: 'open',
          phone,
          organization: {
            connect: {
              id: process.env.DEFAULT_ORGANIZATION_ID || 'default'
            }
          }
        },
      });

      // Send auto-reply
      await this.sendSMS({
        to: phone,
        message: 'Thank you for your message. Our customer service team will get back to you shortly.',
      });
    } catch (error) {
      smsLogger.error('Error triggering customer service workflow', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Get SMS analytics
   */
  async getAnalytics(startDate: Date, endDate: Date): Promise<SMSAnalytics> {
    try {
      const logs = await prisma.smsLog.findMany({
        where: {
          sentAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const sent = logs.filter((log: unknown) => log.status === 'SENT').length;
      const delivered = logs.filter((log: unknown) => log.status === 'DELIVERED').length;
      const failed = logs.filter((log: unknown) => log.status === 'FAILED').length;
      const clicked = logs.filter((log: unknown) => log.clicked).length;

      return {
        sent,
        delivered,
        failed,
        clicked,
        deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      };
    } catch (error) {
      smsLogger.error('Error getting SMS analytics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to get SMS analytics');
    }
  }

  /**
   * Manage SMS subscriptions
   */
  async addToSMSList(phone: string, listId: string, organizationId: string, customFields?: Record<string, unknown>): Promise<void> {
    try {
      // Store SMS subscription in the database
      await prisma.smsSubscription.create({
        data: {
          phone,
          listId,
          customFields: customFields ? JSON.stringify(customFields) : null,
          organizationId,
          isActive: true,
          subscribedAt: new Date()
        }
      });
      
      smsLogger.debug(`Added ${phone} to SMS list ${listId} with custom fields:`, { customFields });
    } catch (error) {
      smsLogger.error('Error adding to SMS list', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to add to SMS list');
    }
  }

  async removeFromSMSList(phone: string, listId: string, organizationId: string): Promise<void> {
    try {
      // Update SMS subscription to inactive
      await prisma.smsSubscription.updateMany({
        where: {
          phone,
          listId,
          organizationId,
          isActive: true
        },
        data: {
          isActive: false,
          unsubscribedAt: new Date()
        }
      });
      
      smsLogger.debug(`Removed ${phone} from SMS list ${listId}`);
    } catch (error) {
      smsLogger.error('Error removing from SMS list', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to remove from SMS list');
    }
  }

  /**
   * Utility functions
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // Default to US
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  private processTemplate(template: string, variables: Record<string, unknown>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return processed;
  }

  /**
   * Check delivery status
   */
  async checkDeliveryStatus(messageId: string): Promise<string> {
    try {
      if (this.provider === 'twilio') {
        const client = getTwilioClient();
        if (!client) throw new Error('Twilio client not initialized');
        const message = await client.messages(messageId).fetch();
        return message.status;
      } else {
        // AWS SNS doesn't provide delivery status directly
        // You would need to use CloudWatch or delivery status logs
        return 'unknown';
      }
    } catch (error) {
      smsLogger.error('Error checking delivery status', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return 'error';
    }
  }

  /**
   * Send test SMS
   */
  async sendTestSMS(phone: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.sendSMS({
        to: phone,
        message: 'This is a test SMS from SmartStore AI. If you receive this, SMS integration is working correctly!',
      });

      // Log test SMS
      await prisma.smsLog.create({
        data: {
          phone: process.env.TWILIO_PHONE_NUMBER!,
          message: 'Test SMS sent',
          status: 'SENT',
          provider: this.provider,
          organization: {
            connect: {
              id: process.env.DEFAULT_ORGANIZATION_ID || 'default'
            }
          }
        },
      });

      return result;
    } catch (error) {
      smsLogger.error('Error sending test SMS', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const smsService = new SMSService();

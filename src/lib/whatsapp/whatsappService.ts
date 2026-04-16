import { prisma } from '@/lib/prisma';
import { realTimeSyncService, SyncEvent } from '@/lib/sync/realTimeSyncService';
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'order';
}

export interface WhatsAppOrder {
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryAddress: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
  };
  paymentMethod: 'CASH_ON_DELIVERY' | 'PREPAID';
  notes?: string;
}

export class WhatsAppService {
  /**
   * Setup WhatsApp integration for an organization
   */
  async setupIntegration(
    organizationId: string,
    phoneNumber: string,
    accessToken: string,
    webhookUrl?: string
  ): Promise<any> {
    // Check if integration already exists
    const existingIntegration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId }
    });

    if (existingIntegration) {
      // Update existing integration
      return await prisma.whatsAppIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          phoneNumber,
          accessToken,
          isActive: true,
          lastSync: new Date()
        }
      });
    } else {
      // Create new integration
      return await prisma.whatsAppIntegration.create({
        data: {
          organizationId,
          phoneNumber,
          accessToken,
          // webhookUrl removed - not in WhatsAppIntegration schema
          isActive: true
        }
      });
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(
    organizationId: string,
    to: string,
    message: string,
    type: 'text' | 'image' | 'document' = 'text'
  ): Promise<any> {
    const integration = await this.getIntegration(organizationId);

    const response = await this.callWhatsAppAPI(integration, 'send_message', {
      to,
      message,
      type
    });

    // Log message in database
    await this.logMessage(organizationId, integration.phoneNumber, to, message, type);

    return response;
  }

  /**
   * Send order confirmation via WhatsApp
   */
  async sendOrderConfirmation(
    organizationId: string,
    order: WhatsAppOrder
  ): Promise<any> {
    const integration = await this.getIntegration(organizationId);

    const message = this.formatOrderConfirmation(order);

    return await this.sendMessage(
      organizationId,
      order.customerPhone,
      message,
      'text'
    );
  }

  /**
   * Process incoming WhatsApp webhook
   */
  async processWebhook(organizationId: string, webhookData: any): Promise<any> {
    const integration = await this.getIntegration(organizationId);

    // Parse webhook data
    const message = this.parseWebhookMessage(webhookData);

    if (!message) {
      return { success: false, message: 'Invalid webhook data' };
    }

    // Check if message contains order information
    if (this.isOrderMessage(message.message)) {
      const order = await this.extractOrderFromMessage(message);

      if (order) {
        // Create order in database
        const createdOrder = await this.createOrderFromWhatsApp(organizationId, order);

        // Send confirmation
        await this.sendOrderConfirmation(organizationId, order);

        return {
          success: true,
          order: createdOrder,
          message: 'Order created successfully'
        };
      }
    }

    // Log regular message
    await this.logMessage(
      organizationId,
      message.from,
      integration.phoneNumber,
      message.message,
      message.type
    );

    return { success: true, message: 'Message processed' };
  }

  /**
   * Get WhatsApp integration for organization
   */
  private async getIntegration(organizationId: string): Promise<any> {
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: {
        organizationId,
        isActive: true
      }
    });

    if (!integration) {
      throw new Error('WhatsApp integration not found or inactive');
    }

    return integration;
  }

  /**
   * Call WhatsApp API
   */
  private async callWhatsAppAPI(
    integration: any,
    action: string,
    data: any
  ): Promise<any> {
    const baseUrl = 'https://graph.facebook.com/v18.0';
    const phoneNumberId = integration.phoneNumberId || 'default';

    switch (action) {
      case 'send_message':
        const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: data.to,
            type: data.type,
            text: { body: data.message }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send WhatsApp message');
        }

        return await response.json();

      default:
        throw new Error('Invalid WhatsApp API action');
    }
  }

  /**
   * Format order confirmation message
   */
  private formatOrderConfirmation(order: WhatsAppOrder): string {
    const itemsList = order.items
      .map(item => `• ${item.name} x${item.quantity} - Rs. ${item.price * item.quantity}`)
      .join('\n');

    return `🛍️ *Order Confirmation*

Thank you for your order! Here are the details:

*Items:*
${itemsList}

*Total: Rs. ${order.total}*
*Payment: ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Prepaid'}*

*Delivery Address:*
${order.deliveryAddress.street}
${order.deliveryAddress.city}, ${order.deliveryAddress.district}
${order.deliveryAddress.postalCode}

${order.notes ? `*Notes:* ${order.notes}` : ''}

We'll process your order and send you tracking details soon! 🚚`;
  }

  /**
   * Check if message contains order information
   */
  private isOrderMessage(message: string): boolean {
    const { OrderParser } = require('@/lib/ai/orderParser');
    const parsed = OrderParser.parseOrderText(message);
    return parsed.intent === 'ORDER';
  }

  /**
   * Extract order information from message
   */
  private async extractOrderFromMessage(message: WhatsAppMessage): Promise<WhatsAppOrder | null> {
    const { OrderParser } = await import('@/lib/ai/orderParser');
    const parsed = OrderParser.parseOrderText(message.message);

    if (parsed.intent !== 'ORDER' || parsed.items.length === 0) {
      return null;
    }

    const items = [];
    let total = 0;

    for (const item of parsed.items) {
      // Try to find product to get real price
      const product = await prisma.product.findFirst({
        where: { name: { contains: item.productName, mode: 'insensitive' } }
      });

      const price = product ? Number(product.price) : 0;
      items.push({
        name: item.productName,
        quantity: item.quantity,
        price
      });
      total += price * item.quantity;
    }

    return {
      customerName: 'WhatsApp User', // Default as we only have phone
      customerPhone: message.from,
      items,
      total,
      deliveryAddress: {
        street: 'Pending',
        city: 'Pending',
        district: 'Pending',
        postalCode: '00000'
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      notes: `Extracted from WhatsApp: "${message.message}"`
    };
  }

  /**
   * Create order from WhatsApp message
   */
  private async createOrderFromWhatsApp(
    organizationId: string,
    order: WhatsAppOrder
  ): Promise<any> {
    // Create customer if not exists
    let customer = await prisma.customer.findFirst({
      where: {
        organizationId,
        phone: order.customerPhone
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId,
          name: order.customerName,
          phone: order.customerPhone,
          email: `${order.customerPhone}@whatsapp.user`, // Placeholder email for WhatsApp users
          address: JSON.stringify(order.deliveryAddress)
        }
      });
    }

    // Create order
    const orderNumber = `ORD-${Date.now()}`;
    const orderRecord = await prisma.order.create({
      data: {
        orderNumber,
        organizationId,
        customerId: customer.id,
        createdById: 'system',
        total: order.total,
        subtotal: order.total,
        status: 'PENDING',
        // Note: paymentStatus doesn't exist in Order model, removed
        notes: order.notes
      }
    });

    // Create order items
    for (const item of order.items) {
      // Find or create product
      let product = await prisma.product.findFirst({
        where: {
          organizationId,
          name: { contains: item.name, mode: 'insensitive' }
        }
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            organizationId,
            name: item.name,
            sku: `WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add required sku
            price: item.price,
            stock: 0, // Add required stock field
            // status removed - not in Product schema
            isActive: true
          }
        });
      }

      // Create order item
      await prisma.orderItem.create({
        data: {
          orderId: orderRecord.id,
          productId: product.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        }
      });
    }

    return orderRecord;
  }

  /**
   * Log message in database
   */
  private async logMessage(
    organizationId: string,
    from: string,
    to: string,
    message: string,
    type: string
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(organizationId);
      const direction = from === integration.phoneNumber ? 'OUTBOUND' : 'INBOUND';

      await prisma.whatsAppMessage.create({
        data: {
          id: `wa_msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          organizationId,
          phoneNumber: direction === 'INBOUND' ? from : to,
          message,
          type,
          direction,
          status: 'DELIVERED',
          updatedAt: new Date()
        }
      });

      logger.debug({
        message: 'WhatsApp message logged to database',
        context: { service: 'WhatsAppService', operation: 'logMessage', organizationId, direction, from, to }
      });
    } catch (error) {
      logger.error({
        message: 'Failed to log WhatsApp message',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'WhatsAppService', operation: 'logMessage', organizationId, from, to }
      });
    }
  }

  /**
   * Parse webhook message
   */
  private parseWebhookMessage(webhookData: any): WhatsAppMessage | null {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages?.[0]) {
        return null;
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];

      return {
        id: message.id,
        from: message.from,
        to: value.metadata?.phone_number_id || 'unknown',
        message: message.text?.body || '',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        type: message.type || 'text'
      };
    } catch (error) {
      logger.error({
        message: 'Error parsing webhook message',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'WhatsAppService', operation: 'parseWebhookMessage' }
      });
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
export { whatsappService as whatsAppService };
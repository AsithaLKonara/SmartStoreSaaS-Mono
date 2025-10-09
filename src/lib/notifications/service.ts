import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendSMS } from '@/lib/integrations/sms';
import { emailService } from '@/lib/email/emailService';

export interface Notification {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'ALL';
  data?: any;
}

export class NotificationService {
  /**
   * Send notification through specified channel(s)
   */
  async send(notification: Notification) {
    const results: any = {
      inApp: false,
      email: false,
      sms: false,
      whatsapp: false,
    };

    try {
      // In-app notification (always send)
      if (notification.channel === 'IN_APP' || notification.channel === 'ALL') {
        results.inApp = await this.sendInApp(notification);
      }

      // Get user contact info
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, phone: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Email notification
      if ((notification.channel === 'EMAIL' || notification.channel === 'ALL') && user.email) {
        results.email = await this.sendEmail(notification, user.email);
      }

      // SMS notification
      if ((notification.channel === 'SMS' || notification.channel === 'ALL') && user.phone) {
        results.sms = await this.sendSMSNotification(notification, user.phone);
      }

      // WhatsApp notification
      if ((notification.channel === 'WHATSAPP' || notification.channel === 'ALL') && user.phone) {
        results.whatsapp = await this.sendWhatsApp(notification, user.phone);
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('Notification send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      };
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(notification: Notification): Promise<boolean> {
    try {
      // Would save to database notifications table
      // For now, just log it
      console.log('In-app notification:', notification.title);
      return true;
    } catch (error) {
      console.error('In-app notification error:', error);
      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification, email: string): Promise<boolean> {
    try {
      const result = await emailService.sendEmail({
        to: email,
        subject: notification.title,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
          </div>
        `,
        textContent: notification.message,
      });

      return result.success;
    } catch (error) {
      console.error('Email notification error:', error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: Notification, phone: string): Promise<boolean> {
    try {
      const result = await sendSMS({
        to: phone,
        message: `${notification.title}: ${notification.message}`,
      });

      return result.success;
    } catch (error) {
      console.error('SMS notification error:', error);
      return false;
    }
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsApp(notification: Notification, phone: string): Promise<boolean> {
    try {
      const result = await sendWhatsAppMessage({
        to: phone,
        message: `*${notification.title}*\n\n${notification.message}`,
      });

      return result.success;
    } catch (error) {
      console.error('WhatsApp notification error:', error);
      return false;
    }
  }

  /**
   * Bulk send notifications to multiple users
   */
  async sendBulk(userIds: string[], notification: Omit<Notification, 'userId'>) {
    const results = await Promise.all(
      userIds.map(userId =>
        this.send({ ...notification, userId })
      )
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: failed === 0,
      sent: successful,
      failed,
      total: userIds.length,
    };
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(orderId: string, status: string) {
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

      // Get organization users (admins/staff)
      const users = await prisma.user.findMany({
        where: {
          organizationId: order.organizationId,
          role: { in: ['ADMIN', 'STAFF'] },
        },
        select: { id: true },
      });

      // Send notification to all relevant users
      await this.sendBulk(
        users.map(u => u.id),
        {
          organizationId: order.organizationId,
          title: 'Order Status Update',
          message: `Order ${order.orderNumber} status changed to ${status}`,
          type: 'INFO',
          channel: 'IN_APP',
          data: { orderId, status },
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Order notification error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          name: true,
          stock: true,
          minStock: true,
          organizationId: true,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const users = await prisma.user.findMany({
        where: {
          organizationId: product.organizationId,
          role: { in: ['ADMIN', 'INVENTORY_MANAGER'] },
        },
        select: { id: true },
      });

      await this.sendBulk(
        users.map(u => u.id),
        {
          organizationId: product.organizationId,
          title: 'Low Stock Alert',
          message: `${product.name} is low on stock. Current: ${product.stock}, Minimum: ${product.minStock}`,
          type: 'WARNING',
          channel: 'ALL',
          data: { productId, stock: product.stock },
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Low stock alert error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const notificationService = new NotificationService();


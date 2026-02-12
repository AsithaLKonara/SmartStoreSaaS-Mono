import { prisma } from '@/lib/prisma';
import { AIRecommendationEngine } from './recommendationEngine';
import { logger } from '@/lib/logger';

export interface AutomationTrigger {
  id: string;
  type: 'ABANDONED_CART' | 'BIRTHDAY' | 'RE_ENGAGEMENT' | 'LOW_STOCK' | 'PRICE_DROP';
  customerId?: string;
  productId?: string;
  organizationId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
}

export interface AutomationAction {
  id: string;
  triggerId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION' | 'LOYALTY_POINTS' | 'DISCOUNT';
  status: 'PENDING' | 'SENT' | 'FAILED';
  content: Record<string, any>;
  scheduledAt: Date;
  sentAt?: Date;
  result?: Record<string, any>;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  customerCount: number;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
}

export class MarketingAutomationEngine {
  private recommendationEngine: AIRecommendationEngine;

  constructor() {
    this.recommendationEngine = new AIRecommendationEngine();
  }

  /**
   * Process all pending automation triggers
   */
  async processAutomationTriggers(organizationId: string): Promise<void> {
    try {
      const pendingTriggers = await prisma.analytics.findMany({
        where: {
          organizationId,
          type: { in: ['CART_ABANDON', 'BIRTHDAY', 'INACTIVE_CUSTOMER'] },
          metadata: {
            // metadata is stored as a string in the schema; search for the flag inside the JSON string
            contains: '"automationProcessed":false'
          }
        },
        take: 100 // Process in batches
      });

      for (const trigger of pendingTriggers) {
        await this.processTrigger(trigger);
      }
    } catch (error) {
      logger.error({
        message: 'Error processing automation triggers',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'processTriggers', organizationId }
      });
    }
  }

  /**
   * Process a single automation trigger
   */
  private async processTrigger(trigger: any): Promise<void> {
    try {
      switch (trigger.type) {
        case 'CART_ABANDON':
          await this.handleAbandonedCart(trigger);
          break;
        case 'BIRTHDAY':
          await this.handleBirthdayCampaign(trigger);
          break;
        case 'INACTIVE_CUSTOMER':
          await this.handleReEngagement(trigger);
          break;
        default:
          logger.warn({
            message: 'Unknown trigger type',
            context: { service: 'MarketingAutomation', operation: 'processTrigger', triggerId: trigger.id, triggerType: trigger.type }
          });
      }

      // Mark as processed
      await prisma.analytics.update({
        where: { id: trigger.id },
        data: {
          metadata: JSON.stringify({
            ...(trigger.metadata || {}),
            automationProcessed: true,
            processedAt: new Date().toISOString()
          })
        }
      });
    } catch (error) {
      logger.error({
        message: 'Error processing trigger',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'processTrigger', triggerId: trigger.id, triggerType: trigger.type }
      });
    }
  }

  /**
   * Handle abandoned cart recovery
   */
  private async handleAbandonedCart(trigger: any): Promise<void> {
    try {
      const { customerId, productIds } = trigger.metadata;

      if (!customerId || !productIds?.length) return;

      // Get customer details
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) return;

      // Get abandoned products
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      // Generate personalized recommendations
      const recommendations = await this.recommendationEngine.getRecommendations(
        customerId,
        trigger.organizationId,
        5
      );

      // Create email campaign
      const emailContent = this.generateAbandonedCartEmail(
        customer,
        products,
        recommendations
      );

      // Schedule email
      await this.scheduleEmailCampaign({
        customerId,
        organizationId: trigger.organizationId,
        subject: 'Complete Your Purchase - Special Offer Inside!',
        content: emailContent,
        type: 'ABANDONED_CART_RECOVERY',
        priority: 'HIGH'
      });

      // Add loyalty points as incentive
      await this.addLoyaltyPoints(customerId, 50, 'Abandoned cart recovery incentive');

    } catch (error) {
      logger.error({
        message: 'Error handling abandoned cart',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'handleAbandonedCart', customerId: trigger.customerId }
      });
    }
  }

  /**
   * Handle birthday campaigns
   */
  private async handleBirthdayCampaign(trigger: any): Promise<void> {
    try {
      const { customerId } = trigger.metadata;

      if (!customerId) return;

      // Get customer details
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) return;

      // Get personalized recommendations
      const recommendations = await this.recommendationEngine.getRecommendations(
        customerId,
        trigger.organizationId,
        8
      );

      // Generate birthday email
      const emailContent = this.generateBirthdayEmail(customer, recommendations);

      // Schedule birthday email
      await this.scheduleEmailCampaign({
        customerId,
        organizationId: trigger.organizationId,
        subject: `Happy Birthday ${customer.name}! 🎉 Special Birthday Offers`,
        content: emailContent,
        type: 'BIRTHDAY_CAMPAIGN',
        priority: 'MEDIUM'
      });

      // Add birthday bonus points
      await this.addLoyaltyPoints(customerId, 100, 'Birthday bonus');

    } catch (error) {
      logger.error({
        message: 'Error handling birthday campaign',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'handleBirthdayCampaign', customerId: trigger.customerId }
      });
    }
  }

  /**
   * Handle customer re-engagement
   */
  private async handleReEngagement(trigger: any): Promise<void> {
    try {
      const { customerId, daysInactive } = trigger.metadata;

      if (!customerId) return;

      // Get customer details
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) return;

      // Get personalized recommendations
      const recommendations = await this.recommendationEngine.getRecommendations(
        customerId,
        trigger.organizationId,
        6
      );

      // Generate re-engagement email
      const emailContent = this.generateReEngagementEmail(
        customer,
        recommendations,
        daysInactive
      );

      // Schedule re-engagement email
      await this.scheduleEmailCampaign({
        customerId,
        organizationId: trigger.organizationId,
        subject: `We Miss You, ${customer.name}! Come Back for Special Offers`,
        content: emailContent,
        type: 'RE_ENGAGEMENT_CAMPAIGN',
        priority: 'MEDIUM'
      });

      // Add comeback bonus points
      await this.addLoyaltyPoints(customerId, 75, 'Re-engagement bonus');

    } catch (error) {
      logger.error({
        message: 'Error handling re-engagement',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'handleReEngagement', customerId: trigger.customerId }
      });
    }
  }

  /**
   * Generate abandoned cart email content
   */
  private generateAbandonedCartEmail(
    customer: any,
    products: any[],
    recommendations: any[]
  ): string {
    const productList = products.map(product =>
      `<li>${product.name} - $${product.price}</li>`
    ).join('');

    const recommendationList = recommendations.map(rec =>
      `<li>${rec.productName} - $${rec.price}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${customer.name},</h2>
        <p>We noticed you left some items in your cart. Don't let them get away!</p>
        
        <h3>Your Abandoned Items:</h3>
        <ul>${productList}</ul>
        
        <p><strong>Complete your purchase now and get 10% off!</strong></p>
        <p>Use code: <strong>COMEBACK10</strong></p>
        
        <h3>You might also like:</h3>
        <ul>${recommendationList}</ul>
        
        <p>Happy shopping!</p>
        <p>Your SmartStore Team</p>
      </div>
    `;
  }

  /**
   * Generate birthday email content
   */
  private generateBirthdayEmail(customer: any, recommendations: any[]): string {
    const recommendationList = recommendations.map(rec =>
      `<li>${rec.productName} - $${rec.price}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Happy Birthday ${customer.name}! 🎉</h2>
        <p>On your special day, we want to give you something extra special!</p>
        
        <h3>🎁 Your Birthday Gifts:</h3>
        <ul>
          <li><strong>100 Bonus Loyalty Points</strong> (already added!)</li>
          <li><strong>20% off everything</strong> - Use code: <strong>BIRTHDAY20</strong></li>
          <li><strong>Free shipping</strong> on orders over $50</li>
        </ul>
        
        <h3>🎯 Personalized for you:</h3>
        <ul>${recommendationList}</ul>
        
        <p>Make your birthday even more special with these exclusive offers!</p>
        <p>Happy Birthday from your SmartStore Team! 🎂</p>
      </div>
    `;
  }

  /**
   * Generate re-engagement email content
   */
  private generateReEngagementEmail(
    customer: any,
    recommendations: any[],
    daysInactive: number
  ): string {
    const recommendationList = recommendations.map(rec =>
      `<li>${rec.productName} - $${rec.price}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${customer.name},</h2>
        <p>It's been ${daysInactive} days since your last visit, and we miss you!</p>
        
        <h3>🌟 Welcome Back Offers:</h3>
        <ul>
          <li><strong>75 Bonus Loyalty Points</strong> (already added!)</li>
          <li><strong>15% off everything</strong> - Use code: <strong>WELCOMEBACK15</strong></li>
          <li><strong>Free shipping</strong> on your next order</li>
        </ul>
        
        <h3>🎯 New arrivals you might love:</h3>
        <ul>${recommendationList}</ul>
        
        <p>Come back and discover what's new!</p>
        <p>Your SmartStore Team</p>
      </div>
    `;
  }

  /**
   * Schedule email campaign
   */
  private async scheduleEmailCampaign(campaign: {
    customerId: string;
    organizationId: string;
    subject: string;
    content: string;
    type: string;
    priority: string;
  }): Promise<void> {
    try {
      // Create campaign record (use sms_campaigns table)
      const marketingCampaign = await prisma.sms_campaigns.create({
        data: {
          id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organizationId: campaign.organizationId,
          name: `${campaign.type} - ${new Date().toISOString()}`,
          templateId: `temp_${Date.now()}`,
          status: 'scheduled',
          scheduledAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create campaign detail (campaign_details table)
      await (prisma as any).campaign_details.create({
        data: {
          campaignId: marketingCampaign.id,
          type: 'EMAIL_TEMPLATE',
          content: {
            subject: campaign.subject,
            body: campaign.content,
            priority: campaign.priority
          },
          targetAudience: { customerIds: [campaign.customerId] },
          schedule: { sendImmediately: true },
          metrics: { status: 'SCHEDULED' }
        }
      });

      // In a real implementation, you would integrate with an email service
      logger.info({
        message: 'Email campaign scheduled',
        context: { service: 'MarketingAutomation', operation: 'scheduleEmailCampaign', customerId: campaign.customerId, campaignType: campaign.type }
      });

    } catch (error) {
      logger.error({
        message: 'Error scheduling email campaign',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'scheduleEmailCampaign', customerId: campaign.customerId }
      });
    }
  }

  /**
   * Add loyalty points to customer
   */
  private async addLoyaltyPoints(
    customerId: string,
    points: number,
    reason: string
  ): Promise<void> {
    try {
      const existing = await prisma.loyaltyAccount.findUnique({
        where: { customerId } // Since customerId is unique
      });

      if (existing) {
        await prisma.loyaltyAccount.update({
          where: { id: existing.id },
          data: { points: { increment: points } }
        });
      } else {
        // We need organizationId to create, assuming we can get it from customer or pass it in
        // For now, we fetch customer to get organizationId
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          await prisma.loyaltyAccount.create({
            data: {
              customerId,
              points,
              organizationId: customer.organizationId
            }
          });
        }
      }

      logger.info({
        message: 'Added loyalty points',
        context: { service: 'MarketingAutomation', operation: 'addLoyaltyPoints', customerId, points, reason }
      });
    } catch (error) {
      logger.error({
        message: 'Error adding loyalty points',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'addLoyaltyPoints', customerId, points }
      });
    }
  }

  /**
   * Create customer segments based on behavior
   */
  async createCustomerSegments(organizationId: string): Promise<CustomerSegment[]> {
    try {
      const segments: CustomerSegment[] = [];

      // Fetch customer order stats
      const customerStats = await prisma.order.groupBy({
        by: ['customerId'],
        where: {
          organizationId,
          status: 'COMPLETED'
        },
        _sum: { total: true },
        _count: { id: true }
      });

      // High-value customers
      const highValueCount = customerStats.filter(s => Number(s._sum.total || 0) >= 1000).length;

      if (highValueCount > 0) {
        segments.push({
          id: `high-value-${Date.now()}`,
          name: 'High-Value Customers',
          criteria: { totalSpent: { gte: 1000 } },
          customerCount: highValueCount,
          organizationId,
          isActive: true,
          createdAt: new Date()
        });
      }

      // Frequent buyers
      const frequentBuyerCount = customerStats.filter(s => (s._count.id || 0) >= 5).length;

      if (frequentBuyerCount > 0) {
        segments.push({
          id: `frequent-${Date.now()}`,
          name: 'Frequent Buyers',
          criteria: { totalOrders: { gte: 5 } },
          customerCount: frequentBuyerCount,
          organizationId,
          isActive: true,
          createdAt: new Date()
        });
      }

      // New customers (last 30 days)
      const newCustomers = await prisma.customer.count({
        where: {
          organizationId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      if (newCustomers > 0) {
        segments.push({
          id: `new-${Date.now()}`,
          name: 'New Customers',
          criteria: { createdAt: { gte: '30_days_ago' } },
          customerCount: newCustomers,
          organizationId,
          isActive: true,
          createdAt: new Date()
        });
      }

      return segments;
    } catch (error) {
      logger.error({
        message: 'Error creating customer segments',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'createCustomerSegments', organizationId }
      });
      return [];
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(organizationId: string): Promise<Record<string, any>> {
    try {
      const [abandonedCarts, birthdayCampaigns, reEngagement] = await Promise.all([
        prisma.analytics.count({
          where: {
            organizationId,
            type: 'CART_ABANDON'
          }
        }),
        prisma.analytics.count({
          where: {
            organizationId,
            type: 'BIRTHDAY'
          }
        }),
        prisma.analytics.count({
          where: {
            organizationId,
            type: 'INACTIVE_CUSTOMER'
          }
        })
      ]);

      return {
        abandonedCarts,
        birthdayCampaigns,
        reEngagement,
        totalAutomations: abandonedCarts + birthdayCampaigns + reEngagement
      };
    } catch (error) {
      logger.error({
        message: 'Error getting automation stats',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'MarketingAutomation', operation: 'getAutomationStats', organizationId }
      });
      return {};
    }
  }
}

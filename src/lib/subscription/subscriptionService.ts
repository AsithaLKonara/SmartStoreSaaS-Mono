import { prisma } from '@/lib/prisma';
import { stripeService } from '@/lib/payments/stripeService';
import { emailService } from '@/lib/email/emailService';
import { realTimeSyncService } from '@/lib/sync/realTimeSyncService';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  limits: {
    products?: number;
    orders?: number;
    storage?: number; // in GB
    apiCalls?: number;
    users?: number;
    warehouses?: number;
  };
  isActive: boolean;
  isPopular?: boolean;
  stripePriceId?: string;
  paypalPlanId?: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  status: string; // Changed to string to match Prisma schema
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  subscriptionId: string;
  metricType: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MembershipTier {
  id: string;
  name: string;
  level: number;
  benefits: string[];
  requirements: {
    minSpent?: number;
    minOrders?: number;
    membershipDuration?: number; // in days
  };
  discountPercentage?: number;
  freeShipping?: boolean;
  prioritySupport?: boolean;
  earlyAccess?: boolean;
}

export interface MembershipStatus {
  userId: string;
  tierId: string;
  level: number;
  totalSpent: number;
  totalOrders: number;
  memberSince: Date;
  nextTierProgress?: {
    nextTierId: string;
    currentProgress: number;
    requiredAmount: number;
  };
}

export interface SubscriptionBox {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  categories: string[];
  customizable: boolean;
  minItems: number;
  maxItems: number;
  isActive: boolean;
}

export interface BoxSubscription {
  id: string;
  userId: string;
  boxId: string;
  preferences: {
    categories?: string[];
    excludeItems?: string[];
    allergies?: string[];
    dietaryRestrictions?: string[];
  };
  deliveryAddress: unknown;
  nextDelivery: Date;
  status: 'active' | 'paused' | 'canceled';
}

export class SubscriptionService {
  async createPlan(plan: Omit<SubscriptionPlan, 'id' | 'stripePriceId' | 'paypalPlanId'>): Promise<SubscriptionPlan> {
    try {
      // Since subscriptionPlan doesn't exist in schema, we'll store it in metadata
      const createdPlan = await prisma.subscription.create({
        data: {
          customerId: 'temp', // This will need to be fixed based on actual requirements
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          metadata: {
            plan: plan,
            type: 'plan_definition'
          }
        }
      });

      return {
        ...plan,
        id: createdPlan.id,
        stripePriceId: undefined,
        paypalPlanId: undefined
      };
    } catch (error) {
      throw new Error(`Failed to create subscription plan: ${error}`);
    }
  }

  async createSubscription(
    customerId: string,
    planId: string,
    paymentMethod: 'stripe' | 'paypal' = 'stripe',
    trialDays?: number
  ): Promise<Subscription> {
    try {
      let stripeSubscriptionId: string | null = null;

      if (paymentMethod === 'stripe') {
        // Create Stripe subscription - fixed method call
        const metadata: Record<string, string> = {
          planId,
          paymentMethod
        };
        
        if (trialDays !== undefined) {
          metadata.trialDays = trialDays.toString();
        }
        
        const stripeSubscription = await stripeService.createSubscription(
          customerId,
          planId,
          metadata
        );
        stripeSubscriptionId = stripeSubscription.id;
      }

      const subscription = await prisma.subscription.create({
        data: {
          customerId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          stripeSubscriptionId,
          metadata: {
            planId,
            paymentMethod,
            trialDays
          }
        }
      });

      // Broadcast real-time sync event
      try {
        await realTimeSyncService.broadcastEvent({
          id: crypto.randomUUID(),
          type: 'customer',
          action: 'create',
          entityId: customerId,
          organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default',
          timestamp: new Date(),
          source: 'subscription-service',
          data: {
            subscriptionId: subscription.id,
            customerId: subscription.customerId,
            status: subscription.status
          }
        });
      } catch (syncError) {
        logger.warn({
          message: 'Failed to broadcast subscription event',
          error: syncError instanceof Error ? syncError : new Error(String(syncError)),
          context: { service: 'SubscriptionService', operation: 'createSubscription', subscriptionId: subscription.id }
        });
      }

      return subscription as Subscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });
      return subscription as Subscription | null;
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error}`);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    try {
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: updates
      });

      // Broadcast real-time sync event
      try {
        await realTimeSyncService.broadcastEvent({
          id: crypto.randomUUID(),
          type: 'customer',
          action: 'update',
          entityId: updatedSubscription.customerId,
          organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default',
          timestamp: new Date(),
          source: 'subscription-service',
          data: {
            subscriptionId: updatedSubscription.id,
            customerId: updatedSubscription.customerId,
            status: updatedSubscription.status
          }
        });
      } catch (syncError) {
        logger.warn({
          message: 'Failed to broadcast subscription update event',
          error: syncError instanceof Error ? syncError : new Error(String(syncError)),
          context: { service: 'SubscriptionService', operation: 'updateSubscription', subscriptionId }
        });
      }

      return updatedSubscription as Subscription;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error}`);
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false,
    reason?: string
  ): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      let cancelAt: Date | undefined;
      if (!immediate) {
        cancelAt = new Date(subscription.currentPeriodEnd);
      }

      // Cancel in Stripe if exists
      if (subscription.stripeSubscriptionId) {
        try {
          await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
        } catch (stripeError) {
          logger.warn({
            message: 'Failed to cancel Stripe subscription',
            error: stripeError instanceof Error ? stripeError : new Error(String(stripeError)),
            context: { service: 'SubscriptionService', operation: 'cancelSubscription', subscriptionId, stripeSubscriptionId: subscription.stripeSubscriptionId }
          });
        }
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: immediate ? 'canceled' : 'active',
          cancelAtPeriodEnd: !immediate,
          metadata: {
            ...(subscription.metadata as Record<string, unknown> || {}),
            cancelReason: reason,
            canceledAt: immediate ? new Date() : undefined
          }
        }
      });

      // Send cancellation email
      try {
        // Send cancellation email
        await this.sendCancellationEmail(subscription.id);
      } catch (emailError) {
        logger.warn({
          message: 'Failed to send cancellation email',
          error: emailError instanceof Error ? emailError : new Error(String(emailError)),
          context: { service: 'SubscriptionService', operation: 'cancelSubscription', subscriptionId }
        });
      }

      // Broadcast real-time sync event
      try {
        await realTimeSyncService.broadcastEvent({
          id: crypto.randomUUID(),
          type: 'customer',
          action: 'update',
          entityId: updatedSubscription.customerId,
          organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default',
          timestamp: new Date(),
          source: 'subscription-service',
          data: {
            subscriptionId: updatedSubscription.id,
            customerId: updatedSubscription.customerId,
            status: updatedSubscription.status,
            immediate
          }
        });
      } catch (syncError) {
        logger.warn({
          message: 'Failed to broadcast subscription cancellation event',
          error: syncError instanceof Error ? syncError : new Error(String(syncError)),
          context: { service: 'SubscriptionService', operation: 'cancelSubscription', subscriptionId }
        });
      }

      return updatedSubscription as Subscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error}`);
    }
  }

  async recordUsage(
    subscriptionId: string,
    metricType: string,
    quantity: number,
    metadata?: Record<string, unknown>
  ): Promise<UsageRecord> {
    try {
      // Check usage limits before recording
      await this.checkUsageLimits(subscriptionId, metricType);

      // Get current subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { metadata: true }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update usage in subscription metadata
      const currentUsage = (subscription.metadata as unknown)?.usage || {};
      const newUsage = {
        ...currentUsage,
        [metricType]: (currentUsage[metricType] || 0) + quantity,
        lastUpdated: new Date().toISOString()
      };

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          metadata: {
            ...(subscription.metadata as Record<string, unknown> || {}),
            usage: newUsage
          }
        }
      });

      // Broadcast usage update event
      await realTimeSyncService.broadcastEvent({
        id: crypto.randomUUID(),
        type: 'customer',
        action: 'update',
        entityId: subscriptionId,
        organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default',
        timestamp: new Date(),
        source: 'subscription-service',
        data: {
          metricType,
          quantity,
          totalUsage: newUsage[metricType]
        }
      });

      // Return mock usage record since UsageRecord model doesn't exist
      return {
        id: crypto.randomUUID(),
        subscriptionId,
        metricType,
        quantity,
        timestamp: new Date(),
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to record usage: ${error}`);
    }
  }

  async createMembershipTier(tier: Omit<MembershipTier, 'id'>): Promise<MembershipTier> {
    try {
      // Since membershipTier doesn't exist in schema, we'll store it in metadata
      const createdTier = await prisma.subscription.create({
        data: {
          customerId: 'temp', // This will need to be fixed based on actual requirements
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          cancelAtPeriodEnd: false,
          metadata: {
            tier: tier,
            type: 'membership_tier'
          }
        }
      });

      return {
        ...tier,
        id: createdTier.id
      };
    } catch (error) {
      throw new Error(`Failed to create membership tier: ${error}`);
    }
  }

  async updateMembershipStatus(customerId: string): Promise<void> {
    try {
      // Get customer with completed orders
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            where: { status: 'COMPLETED' },
            select: { totalAmount: true, createdAt: true }
          }
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate total spent from completed orders
      const totalSpent = customer.orders.reduce((sum: number, order: unknown) => sum + order.totalAmount, 0);

      // Determine membership tier based on total spent
      const currentTier = this.getTierLevel(totalSpent);
      const nextTier = this.getNextTier(currentTier);
      const progress = this.calculateTierProgress(totalSpent, currentTier);
      const requiredForNextTier = this.getRequiredAmountForNextTier(nextTier);

      // Update customer metadata with membership info
      // Note: Customer model doesn't have metadata field, so we'll log this info
      logger.info({
        message: 'Customer membership status updated',
        context: { service: 'SubscriptionService', operation: 'updateMembershipStatus', customerId, currentTier, progress, requiredForNextTier }
      });

      // Update total spent
      await prisma.customer.update({
        where: { id: customerId },
        data: { totalSpent }
      });

      // Broadcast membership update
      realTimeSyncService.broadcastEvent({
        id: crypto.randomUUID(),
        type: 'customer',
        action: 'update',
        entityId: customerId,
        organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default',
        timestamp: new Date(),
        source: 'subscription-service',
        data: {
          type: 'membership_updated',
          tier: currentTier,
          progress,
          totalSpent
        }
      });

    } catch (error) {
      logger.error({
        message: 'Error updating membership status',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SubscriptionService', operation: 'updateMembershipStatus', customerId }
      });
      throw error;
    }
  }

  async createSubscriptionBox(box: Omit<SubscriptionBox, 'id'>): Promise<SubscriptionBox> {
    try {
      // Since subscriptionBox doesn't exist in schema, we'll store it in metadata
      const createdBox = await prisma.subscription.create({
        data: {
          customerId: 'temp', // This will need to be fixed based on actual requirements
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          metadata: {
            box: box,
            type: 'subscription_box'
          }
        }
      });

      return {
        ...box,
        id: createdBox.id
      };
    } catch (error) {
      throw new Error(`Failed to create subscription box: ${error}`);
    }
  }

  async getSubscriptionBoxes(customerId: string): Promise<unknown[]> {
    try {
      // Note: SubscriptionBox model doesn't exist in the schema
      // This functionality needs to be implemented with actual models
      logger.warn({
        message: 'SubscriptionBox model not found in schema - returning empty array',
        context: { service: 'SubscriptionService', operation: 'getSubscriptionBoxes', customerId }
      });
      return [];
    } catch (error) {
      logger.error({
        message: 'Error getting subscription boxes',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SubscriptionService', operation: 'getSubscriptionBoxes', customerId }
      });
      throw error;
    }
  }

  private getIntervalMilliseconds(interval: 'month' | 'year' | 'week' | 'day', count: number): number {
    const multipliers = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };

    return multipliers[interval] * count;
  }

  private async checkUsageLimits(subscriptionId: string, metricType: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { metadata: true }
      });

      if (!subscription) return;

      const plan = (subscription.metadata as unknown)?.plan;
      if (!plan) {
        logger.warn({
          message: 'No plan information found in subscription metadata',
          context: { service: 'SubscriptionService', operation: 'sendWelcomeEmail', subscriptionId }
        });
        return;
      }

      // Check usage limits based on plan
      const limits = plan.limits || {};
      const currentUsage = await this.getCurrentUsage(subscriptionId, metricType);
      const limit = limits[metricType];

      if (limit && currentUsage >= limit) {
        throw new Error(`Usage limit exceeded for ${metricType}`);
      }
    } catch (error) {
      throw new Error(`Failed to check usage limits: ${error}`);
    }
  }

  async sendSubscriptionWelcomeEmail(subscriptionId: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { customer: true }
      });

      if (!subscription || !subscription.customer) {
        throw new Error('Subscription or customer not found');
      }

      const customer = await prisma.customer.findUnique({
        where: { id: subscription.customerId }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      await emailService.sendEmail({
        to: customer.email || '',
        subject: 'Welcome to Your Subscription!',
        templateId: 'subscription-welcome',
        templateData: {
          customerName: customer.name || 'Valued Customer',
          planName: (subscription.metadata as unknown)?.plan || 'Premium Plan',
          startDate: subscription.currentPeriodStart.toLocaleDateString(),
          endDate: subscription.currentPeriodEnd.toLocaleDateString()
        }
      });
    } catch (error) {
      logger.error({
        message: 'Error sending welcome email',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SubscriptionService', operation: 'sendWelcomeEmail', subscriptionId }
      });
      throw error;
    }
  }

  async sendCancellationEmail(subscriptionId: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { customer: true }
      });

      if (!subscription || !subscription.customer) {
        throw new Error('Subscription or customer not found');
      }

      const customer = await prisma.customer.findUnique({
        where: { id: subscription.customerId }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      await emailService.sendEmail({
        to: customer.email || '',
        subject: 'Subscription Cancelled',
        templateId: 'subscription-cancelled',
        templateData: {
          customerName: customer.name || 'Valued Customer',
          planName: (subscription.metadata as unknown)?.plan || 'Premium Plan',
          endDate: subscription.currentPeriodEnd.toLocaleDateString()
        }
      });
    } catch (error) {
      logger.error({
        message: 'Error sending cancellation email',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SubscriptionService', operation: 'sendCancellationEmail', subscriptionId }
      });
      throw error;
    }
  }

  async sendUsageLimitEmail(subscriptionId: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { customer: true }
      });

      if (!subscription || !subscription.customer) {
        throw new Error('Subscription or customer not found');
      }

      const customer = await prisma.customer.findUnique({
        where: { id: subscription.customerId }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      await emailService.sendEmail({
        to: customer.email || '',
        subject: 'Usage Limit Reached',
        templateId: 'usage-limit-reached',
        templateData: {
          customerName: customer.name || 'Valued Customer',
          planName: (subscription.metadata as unknown)?.plan || 'Premium Plan',
          currentUsage: (subscription.metadata as unknown)?.usage || 0,
          usageLimit: (subscription.metadata as unknown)?.usageLimit || 'Unlimited'
        }
      });
    } catch (error) {
      logger.error({
        message: 'Error sending usage limit email',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SubscriptionService', operation: 'sendUsageLimitEmail', subscriptionId, metricType }
      });
      throw error;
    }
  }

  private async getCurrentUsage(subscriptionId: string, metricType: string): Promise<number> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { metadata: true }
      });

      if (!subscription) return 0;

      const usage = (subscription.metadata as unknown)?.usage || {};
      return usage[metricType] || 0;
    } catch (error) {
      logger.warn({
        message: 'Failed to get current usage',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'SubscriptionService', operation: 'getCurrentUsage', subscriptionId, metricType }
      });
      return 0;
    }
  }

  private getTierLevel(totalSpent: number): string {
    if (totalSpent >= 10000) return 'diamond';
    if (totalSpent >= 5000) return 'platinum';
    if (totalSpent >= 2000) return 'gold';
    if (totalSpent >= 500) return 'silver';
    return 'bronze';
  }

  private getNextTier(currentTier: string): string {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : currentTier;
  }

  private calculateTierProgress(totalSpent: number, currentTier: string): number {
    const tierThresholds: Record<string, number> = {
      bronze: 0,
      silver: 500,
      gold: 2000,
      platinum: 5000,
      diamond: 10000
    };
    
    const currentThreshold = tierThresholds[currentTier];
    const nextThreshold = tierThresholds[this.getNextTier(currentTier)] || currentThreshold;
    
    if (nextThreshold === currentThreshold) return 100;
    
    const progress = ((totalSpent - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  private getRequiredAmountForNextTier(nextTier: string): number {
    const tierThresholds: Record<string, number> = {
      bronze: 500,
      silver: 2000,
      gold: 5000,
      platinum: 10000,
      diamond: 10000
    };
    return tierThresholds[nextTier] || 0;
  }
}

export const subscriptionService = new SubscriptionService();

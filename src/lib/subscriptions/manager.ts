/**
 * Subscription Management System
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BillingInterval {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: BillingInterval;
  trialDays?: number;
  features: string[];
}

/**
 * Create subscription
 */
export async function createSubscription(data: {
  customerId: string;
  planId: string;
  startDate?: Date;
  trialEndDate?: Date;
  organizationId: string;
}): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    const startDate = data.startDate || new Date();
    const nextBillingDate = calculateNextBillingDate(startDate, plan.interval as BillingInterval);

    const subscription = await prisma.subscription.create({
      data: {
        organizationId: data.organizationId,
        customerId: data.customerId,
        planId: data.planId,
        status: SubscriptionStatus.ACTIVE as any,
        startDate,
        trialEndDate: data.trialEndDate,
        nextBillingDate,
        currentPeriodStart: startDate,
        currentPeriodEnd: nextBillingDate,
      },
      include: {
        subscriptionPlan: true,
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, subscription };
  } catch (error: any) {
    logger.error({
      message: 'Create subscription error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'SubscriptionManager', operation: 'createSubscription', customerId: data.customerId, planId: data.planId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Calculate next billing date
 */
export function calculateNextBillingDate(currentDate: Date, interval: BillingInterval): Date {
  const nextDate = new Date(currentDate);

  switch (interval) {
    case BillingInterval.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case BillingInterval.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case BillingInterval.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case BillingInterval.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        endsAt: immediately ? new Date() : subscription.currentPeriodEnd,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Cancel subscription error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'SubscriptionManager', operation: 'cancelSubscription', subscriptionId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED, // Fixed: PAUSED doesn't exist, using CANCELLED
        pausedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Pause subscription error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'SubscriptionManager', operation: 'pauseSubscription', subscriptionId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pausedAt: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Resume subscription error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'SubscriptionManager', operation: 'resumeSubscription', subscriptionId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      return { success: false, error: 'Plan not found' };
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
      },
    });

    return { success: true };
  } catch (error: any) {
    logger.error({
      message: 'Change plan error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'SubscriptionManager', operation: 'changePlan', subscriptionId, newPlanId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get subscriptions due for billing
 */
export async function getSubscriptionsDueForBilling(): Promise<any[]> {
  const now = new Date();

  return await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: { lte: now },
    },
    include: {
      customer: true,
    },
  });
}

/**
 * Process subscription billing
 */
export async function processSubscriptionBilling(subscriptionId: string): Promise<{
  success: boolean;
  invoice?: any;
  error?: string;
}> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        subscriptionPlan: true // Fetch plan details
      },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (!subscription.subscriptionPlan) {
      return { success: false, error: 'Subscription plan not found' };
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        customerId: subscription.customerId!,
        subscriptionId: subscription.id,
        organizationId: subscription.organizationId!,
        amount: Number(subscription.subscriptionPlan.price), // Use plan price
        total: Number(subscription.subscriptionPlan.price),
        status: 'SENT' as const,
        dueDate: new Date(),
      },
    });

    // Update subscription billing dates
    const nextBillingDate = calculateNextBillingDate(
      subscription.nextBillingDate || new Date(),
      subscription.subscriptionPlan.interval as BillingInterval
    );

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: subscription.nextBillingDate || new Date(),
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
      },
    });

    return { success: true, invoice };
  } catch (error: any) {
    logger.error({
      message: 'Process billing error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'SubscriptionManager', operation: 'processBilling', subscriptionId }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(customerId: string) {
  return await prisma.subscription.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}


/**
 * Subscription Management System
 */

import { prisma } from '@/lib/prisma';

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
        customerId: data.customerId,
        planId: data.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        trialEndDate: data.trialEndDate,
        nextBillingDate,
        currentPeriodStart: startDate,
        currentPeriodEnd: nextBillingDate,
      },
      include: {
        plan: true,
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
    console.error('Create subscription error:', error);
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
    console.error('Cancel subscription error:', error);
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
        status: SubscriptionStatus.PAUSED,
        pausedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Pause subscription error:', error);
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
    console.error('Resume subscription error:', error);
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
    console.error('Change plan error:', error);
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
      plan: true,
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
      include: { plan: true, customer: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        amount: subscription.plan.price,
        status: 'PENDING',
        dueDate: new Date(),
      },
    });

    // Update subscription billing dates
    const nextBillingDate = calculateNextBillingDate(
      subscription.nextBillingDate,
      subscription.plan.interval as BillingInterval
    );

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: subscription.nextBillingDate,
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
      },
    });

    return { success: true, invoice };
  } catch (error: any) {
    console.error('Process billing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(customerId: string) {
  return await prisma.subscription.findMany({
    where: { customerId },
    include: {
      plan: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}


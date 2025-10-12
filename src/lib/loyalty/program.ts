/**
 * Customer Loyalty & Rewards Program
 */

import { prisma } from '@/lib/prisma';

export enum RewardType {
  POINTS = 'POINTS',
  DISCOUNT = 'DISCOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  FREE_PRODUCT = 'FREE_PRODUCT',
}

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface LoyaltyConfig {
  pointsPerDollar: number;
  pointsPerOrder: number;
  tierThresholds: {
    [key in LoyaltyTier]: number;
  };
  tierBenefits: {
    [key in LoyaltyTier]: {
      discountPercent: number;
      bonusPoints: number;
      freeShipping: boolean;
    };
  };
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  pointsPerDollar: 1,
  pointsPerOrder: 10,
  tierThresholds: {
    BRONZE: 0,
    SILVER: 500,
    GOLD: 1500,
    PLATINUM: 5000,
  },
  tierBenefits: {
    BRONZE: { discountPercent: 0, bonusPoints: 0, freeShipping: false },
    SILVER: { discountPercent: 5, bonusPoints: 50, freeShipping: false },
    GOLD: { discountPercent: 10, bonusPoints: 100, freeShipping: true },
    PLATINUM: { discountPercent: 15, bonusPoints: 200, freeShipping: true },
  },
};

/**
 * Calculate points earned from order
 */
export function calculatePointsEarned(orderTotal: number, config: LoyaltyConfig = DEFAULT_CONFIG): number {
  return Math.floor(orderTotal * config.pointsPerDollar) + config.pointsPerOrder;
}

/**
 * Determine loyalty tier based on points
 */
export function determineLoyaltyTier(points: number, config: LoyaltyConfig = DEFAULT_CONFIG): LoyaltyTier {
  if (points >= config.tierThresholds.PLATINUM) return LoyaltyTier.PLATINUM;
  if (points >= config.tierThresholds.GOLD) return LoyaltyTier.GOLD;
  if (points >= config.tierThresholds.SILVER) return LoyaltyTier.SILVER;
  return LoyaltyTier.BRONZE;
}

/**
 * Add points to customer
 */
export async function addPoints(
  customerId: string,
  points: number,
  reason: string,
  orderId?: string
): Promise<{ success: boolean; newPoints: number; newTier: LoyaltyTier }> {
  try {
    // Get or create loyalty account
    let loyalty = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
    });

    if (!loyalty) {
      loyalty = await prisma.loyaltyAccount.create({
        data: {
          customerId,
          points: 0,
          tier: LoyaltyTier.BRONZE,
          lifetimePoints: 0,
        },
      });
    }

    const newPoints = loyalty.points + points;
    const newLifetimePoints = loyalty.lifetimePoints + points;
    const newTier = determineLoyaltyTier(newLifetimePoints);

    // Update loyalty account
    await prisma.loyaltyAccount.update({
      where: { customerId },
      data: {
        points: newPoints,
        lifetimePoints: newLifetimePoints,
        tier: newTier,
      },
    });

    // Record transaction
    await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        points,
        type: 'EARNED',
        reason,
        orderId,
      },
    });

    return { success: true, newPoints, newTier };
  } catch (error) {
    console.error('Add points error:', error);
    return { success: false, newPoints: 0, newTier: LoyaltyTier.BRONZE };
  }
}

/**
 * Redeem points
 */
export async function redeemPoints(
  customerId: string,
  points: number,
  reason: string,
  orderId?: string
): Promise<{ success: boolean; newPoints: number; error?: string }> {
  try {
    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { customerId },
    });

    if (!loyalty) {
      return { success: false, newPoints: 0, error: 'Loyalty account not found' };
    }

    if (loyalty.points < points) {
      return { success: false, newPoints: loyalty.points, error: 'Insufficient points' };
    }

    const newPoints = loyalty.points - points;

    await prisma.loyaltyAccount.update({
      where: { customerId },
      data: { points: newPoints },
    });

    await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        points: -points,
        type: 'REDEEMED',
        reason,
        orderId,
      },
    });

    return { success: true, newPoints };
  } catch (error) {
    console.error('Redeem points error:', error);
    return { success: false, newPoints: 0, error: 'Redemption failed' };
  }
}

/**
 * Get customer loyalty status
 */
export async function getLoyaltyStatus(customerId: string) {
  const loyalty = await prisma.loyaltyAccount.findUnique({
    where: { customerId },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!loyalty) {
    return {
      customerId,
      points: 0,
      tier: LoyaltyTier.BRONZE,
      lifetimePoints: 0,
      benefits: DEFAULT_CONFIG.tierBenefits.BRONZE,
    };
  }

  const currentTier = loyalty.tier as LoyaltyTier;
  const benefits = DEFAULT_CONFIG.tierBenefits[currentTier];
  
  // Calculate points to next tier
  const tiers = Object.entries(DEFAULT_CONFIG.tierThresholds)
    .sort((a, b) => a[1] - b[1]);
  
  let nextTier: LoyaltyTier | null = null;
  let pointsToNextTier = 0;

  for (const [tier, threshold] of tiers) {
    if (threshold > loyalty.lifetimePoints) {
      nextTier = tier as LoyaltyTier;
      pointsToNextTier = threshold - loyalty.lifetimePoints;
      break;
    }
  }

  return {
    ...loyalty,
    benefits,
    nextTier,
    pointsToNextTier,
  };
}

/**
 * Get loyalty transactions history
 */
export async function getLoyaltyHistory(customerId: string, limit: number = 50) {
  return await prisma.loyaltyTransaction.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
        },
      },
    },
  });
}

/**
 * Calculate points value in currency
 */
export function calculatePointsValue(points: number, pointsPerDollar: number = 100): number {
  return points / pointsPerDollar;
}


import { EventEmitter } from 'events';
import { logger } from '../logger';

// Enhanced Loyalty System for SmartStore SaaS
export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  color: string;
  icon: string;
  multiplier: number; // Points multiplier for this tier
}

export interface LoyaltyPoints {
  id: string;
  customerId: string;
  points: number;
  tier: string;
  totalEarned: number;
  totalRedeemed: number;
  lastActivity: Date;
  expiresAt?: Date;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
  points: number;
  reason: string;
  orderId?: string;
  productId?: string;
  campaignId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: 'DISCOUNT' | 'FREE_SHIPPING' | 'PRODUCT' | 'CASHBACK';
  value: number; // Discount percentage, cashback amount, etc.
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  usageLimit?: number;
  usedCount: number;
  image?: string;
  category: string;
}

export interface LoyaltyCampaign {
  id: string;
  name: string;
  description: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'PURCHASE' | 'REFERRAL' | 'REVIEW' | 'SOCIAL_SHARE';
  pointsMultiplier: number;
  bonusPoints: number;
  conditions: {
    minOrderValue?: number;
    minOrderCount?: number;
    productCategories?: string[];
    customerTiers?: string[];
  };
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
}

export interface LoyaltyAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerCustomer: number;
  redemptionRate: number;
  tierDistribution: Record<string, number>;
  topRewards: Array<{
    rewardId: string;
    name: string;
    redemptionCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    pointsEarned: number;
    pointsRedeemed: number;
    newCustomers: number;
  }>;
}

// Default loyalty tiers
const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    benefits: ['1x Points on purchases', 'Basic support'],
    color: '#CD7F32',
    icon: '🥉',
    multiplier: 1.0
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    benefits: ['1.2x Points on purchases', 'Priority support', 'Free shipping on orders over LKR 3000'],
    color: '#C0C0C0',
    icon: '🥈',
    multiplier: 1.2
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 9999,
    benefits: ['1.5x Points on purchases', 'VIP support', 'Free shipping on all orders', 'Early access to sales'],
    color: '#FFD700',
    icon: '🥇',
    multiplier: 1.5
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minPoints: 10000,
    benefits: ['2x Points on purchases', 'Concierge support', 'Free shipping on all orders', 'Exclusive products', 'Personal shopping assistant'],
    color: '#E5E4E2',
    icon: '💎',
    multiplier: 2.0
  }
];

export class EnhancedLoyaltySystem extends EventEmitter {
  private tiers: Map<string, LoyaltyTier> = new Map();
  private rewards: Map<string, LoyaltyReward> = new Map();
  private campaigns: Map<string, LoyaltyCampaign> = new Map();

  constructor() {
    super();
    this.initializeTiers();
  }

  private initializeTiers() {
    DEFAULT_TIERS.forEach(tier => {
      this.tiers.set(tier.id, tier);
    });
  }

  // Calculate points for a purchase
  calculatePoints(
    customerId: string,
    orderValue: number,
    orderItems: Array<{ category: string; value: number }>,
    appliedCampaigns: string[] = []
  ): number {
    const customerTier = this.getCustomerTier(customerId);
    const basePoints = Math.floor(orderValue / 100); // 1 point per LKR 100
    
    // Apply tier multiplier
    let totalPoints = Math.floor(basePoints * customerTier.multiplier);
    
    // Apply campaign bonuses
    appliedCampaigns.forEach(campaignId => {
      const campaign = this.campaigns.get(campaignId);
      if (campaign && this.isCampaignValid(campaign)) {
        totalPoints += campaign.bonusPoints;
        totalPoints = Math.floor(totalPoints * campaign.pointsMultiplier);
      }
    });
    
    return totalPoints;
  }

  // Get customer's current tier
  getCustomerTier(customerId: string): LoyaltyTier {
    // This would typically fetch from database
    // For now, return Bronze tier as default
    return this.tiers.get('bronze')!;
  }

  // Add points to customer account
  async addPoints(
    customerId: string,
    points: number,
    reason: string,
    orderId?: string,
    campaignId?: string
  ): Promise<LoyaltyTransaction> {
    const transaction: LoyaltyTransaction = {
      id: this.generateId(),
      customerId,
      type: 'EARNED',
      points,
      reason,
      orderId,
      campaignId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    };

    // Emit event for real-time updates
    this.emit('pointsEarned', transaction);

    // Update customer points in database
    await this.updateCustomerPoints(customerId, points);

    return transaction;
  }

  // Redeem points for reward
  async redeemPoints(
    customerId: string,
    rewardId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; transaction?: LoyaltyTransaction; error?: string }> {
    const reward = this.rewards.get(rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (!reward.isActive) {
      return { success: false, error: 'Reward is not active' };
    }

    if (reward.validTo && new Date() > reward.validTo) {
      return { success: false, error: 'Reward has expired' };
    }

    if (reward.usageLimit && reward.usedCount >= reward.usageLimit) {
      return { success: false, error: 'Reward usage limit reached' };
    }

    const totalPointsRequired = reward.pointsRequired * quantity;
    const customerPoints = await this.getCustomerPoints(customerId);

    if (customerPoints < totalPointsRequired) {
      return { success: false, error: 'Insufficient points' };
    }

    const transaction: LoyaltyTransaction = {
      id: this.generateId(),
      customerId,
      type: 'REDEEMED',
      points: -totalPointsRequired,
      reason: `Redeemed ${quantity}x ${reward.name}`,
      productId: rewardId,
      createdAt: new Date()
    };

    // Emit event for real-time updates
    this.emit('pointsRedeemed', transaction);

    // Update customer points and reward usage
    await this.updateCustomerPoints(customerId, -totalPointsRequired);
    await this.updateRewardUsage(rewardId, quantity);

    return { success: true, transaction };
  }

  // Get available rewards for customer
  getAvailableRewards(customerId: string, customerTier?: string): LoyaltyReward[] {
    const customerPoints = this.getCustomerPoints(customerId);
    const tier = customerTier || this.getCustomerTier(customerId).id;

    return Array.from(this.rewards.values()).filter(reward => {
      if (!reward.isActive) return false;
      if (reward.validTo && new Date() > reward.validTo) return false;
      if (reward.usageLimit && reward.usedCount >= reward.usageLimit) return false;
      if (reward.pointsRequired > customerPoints) return false;
      
      // Check tier restrictions if any
      return true;
    });
  }

  // Get customer's loyalty analytics
  async getCustomerAnalytics(customerId: string): Promise<{
    points: LoyaltyPoints;
    tier: LoyaltyTier;
    transactions: LoyaltyTransaction[];
    availableRewards: LoyaltyReward[];
    nextTier?: LoyaltyTier;
    pointsToNextTier: number;
  }> {
    const points = await this.getCustomerPointsData(customerId);
    const tier = this.getCustomerTier(customerId);
    const transactions = await this.getCustomerTransactions(customerId);
    const availableRewards = this.getAvailableRewards(customerId);
    
    // Find next tier
    const nextTier = this.getNextTier(tier.id);
    const pointsToNextTier = nextTier ? nextTier.minPoints - points.points : 0;

    return {
      points,
      tier,
      transactions,
      availableRewards,
      nextTier,
      pointsToNextTier
    };
  }

  // Get system-wide loyalty analytics
  async getSystemAnalytics(): Promise<LoyaltyAnalytics> {
    // This would typically aggregate data from database
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      averagePointsPerCustomer: 0,
      redemptionRate: 0,
      tierDistribution: {},
      topRewards: [],
      monthlyTrends: []
    };
  }

  // Create loyalty campaign
  createCampaign(campaign: Omit<LoyaltyCampaign, 'id' | 'usedCount'>): LoyaltyCampaign {
    const newCampaign: LoyaltyCampaign = {
      ...campaign,
      id: this.generateId(),
      usedCount: 0
    };

    this.campaigns.set(newCampaign.id, newCampaign);
    this.emit('campaignCreated', newCampaign);

    return newCampaign;
  }

  // Create loyalty reward
  createReward(reward: Omit<LoyaltyReward, 'id' | 'usedCount'>): LoyaltyReward {
    const newReward: LoyaltyReward = {
      ...reward,
      id: this.generateId(),
      usedCount: 0
    };

    this.rewards.set(newReward.id, newReward);
    this.emit('rewardCreated', newReward);

    return newReward;
  }

  // Check if campaign is valid
  private isCampaignValid(campaign: LoyaltyCampaign): boolean {
    if (!campaign.isActive) return false;
    if (new Date() < campaign.validFrom) return false;
    if (campaign.validTo && new Date() > campaign.validTo) return false;
    if (campaign.usageLimit && campaign.usedCount >= campaign.usageLimit) return false;
    return true;
  }

  // Get next tier
  private getNextTier(currentTierId: string): LoyaltyTier | undefined {
    const tiers = Array.from(this.tiers.values()).sort((a, b) => a.minPoints - b.minPoints);
    const currentIndex = tiers.findIndex(tier => tier.id === currentTierId);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : undefined;
  }

  // Generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Database operations (would integrate with Prisma)
  private async updateCustomerPoints(customerId: string, points: number): Promise<void> {
    // Update customer points in database
    logger.debug({
      message: 'Updating customer points',
      context: { service: 'EnhancedLoyaltySystem', operation: 'updateCustomerPoints', customerId, points }
    });
  }

  private async getCustomerPoints(customerId: string): Promise<number> {
    // Get customer points from database
    return 0; // Placeholder
  }

  private async getCustomerPointsData(customerId: string): Promise<LoyaltyPoints> {
    // Get customer points data from database
    return {
      id: this.generateId(),
      customerId,
      points: 0,
      tier: 'bronze',
      totalEarned: 0,
      totalRedeemed: 0,
      lastActivity: new Date()
    };
  }

  private async getCustomerTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
    // Get customer transactions from database
    return [];
  }

  private async updateRewardUsage(rewardId: string, quantity: number): Promise<void> {
    // Update reward usage count in database
    logger.debug({
      message: 'Updating reward usage',
      context: { service: 'EnhancedLoyaltySystem', operation: 'updateRewardUsage', rewardId, quantity }
    });
  }

  // Get all tiers
  getAllTiers(): LoyaltyTier[] {
    return Array.from(this.tiers.values());
  }

  // Get all rewards
  getAllRewards(): LoyaltyReward[] {
    return Array.from(this.rewards.values());
  }

  // Get all campaigns
  getAllCampaigns(): LoyaltyCampaign[] {
    return Array.from(this.campaigns.values());
  }
}

// Singleton instance
export const enhancedLoyaltySystem = new EnhancedLoyaltySystem();

// Enhanced Loyalty System for SmartStore SaaS
export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  color: string;
  icon: string;
  multiplier: number; // Points multiplier for this tier
}

export interface LoyaltyPoints {
  id: string;
  customerId: string;
  points: number;
  tier: string;
  totalEarned: number;
  totalRedeemed: number;
  lastActivity: Date;
  expiresAt?: Date;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
  points: number;
  reason: string;
  orderId?: string;
  productId?: string;
  campaignId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: 'DISCOUNT' | 'FREE_SHIPPING' | 'PRODUCT' | 'CASHBACK';
  value: number; // Discount percentage, cashback amount, etc.
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  usageLimit?: number;
  usedCount: number;
  image?: string;
  category: string;
}

export interface LoyaltyCampaign {
  id: string;
  name: string;
  description: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'PURCHASE' | 'REFERRAL' | 'REVIEW' | 'SOCIAL_SHARE';
  pointsMultiplier: number;
  bonusPoints: number;
  conditions: {
    minOrderValue?: number;
    minOrderCount?: number;
    productCategories?: string[];
    customerTiers?: string[];
  };
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
}

export interface LoyaltyAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerCustomer: number;
  redemptionRate: number;
  tierDistribution: Record<string, number>;
  topRewards: Array<{
    rewardId: string;
    name: string;
    redemptionCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    pointsEarned: number;
    pointsRedeemed: number;
    newCustomers: number;
  }>;
}

// Default loyalty tiers
const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    benefits: ['1x Points on purchases', 'Basic support'],
    color: '#CD7F32',
    icon: '🥉',
    multiplier: 1.0
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    benefits: ['1.2x Points on purchases', 'Priority support', 'Free shipping on orders over LKR 3000'],
    color: '#C0C0C0',
    icon: '🥈',
    multiplier: 1.2
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 9999,
    benefits: ['1.5x Points on purchases', 'VIP support', 'Free shipping on all orders', 'Early access to sales'],
    color: '#FFD700',
    icon: '🥇',
    multiplier: 1.5
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minPoints: 10000,
    benefits: ['2x Points on purchases', 'Concierge support', 'Free shipping on all orders', 'Exclusive products', 'Personal shopping assistant'],
    color: '#E5E4E2',
    icon: '💎',
    multiplier: 2.0
  }
];

export class EnhancedLoyaltySystem extends EventEmitter {
  private tiers: Map<string, LoyaltyTier> = new Map();
  private rewards: Map<string, LoyaltyReward> = new Map();
  private campaigns: Map<string, LoyaltyCampaign> = new Map();

  constructor() {
    super();
    this.initializeTiers();
  }

  private initializeTiers() {
    DEFAULT_TIERS.forEach(tier => {
      this.tiers.set(tier.id, tier);
    });
  }

  // Calculate points for a purchase
  calculatePoints(
    customerId: string,
    orderValue: number,
    orderItems: Array<{ category: string; value: number }>,
    appliedCampaigns: string[] = []
  ): number {
    const customerTier = this.getCustomerTier(customerId);
    const basePoints = Math.floor(orderValue / 100); // 1 point per LKR 100
    
    // Apply tier multiplier
    let totalPoints = Math.floor(basePoints * customerTier.multiplier);
    
    // Apply campaign bonuses
    appliedCampaigns.forEach(campaignId => {
      const campaign = this.campaigns.get(campaignId);
      if (campaign && this.isCampaignValid(campaign)) {
        totalPoints += campaign.bonusPoints;
        totalPoints = Math.floor(totalPoints * campaign.pointsMultiplier);
      }
    });
    
    return totalPoints;
  }

  // Get customer's current tier
  getCustomerTier(customerId: string): LoyaltyTier {
    // This would typically fetch from database
    // For now, return Bronze tier as default
    return this.tiers.get('bronze')!;
  }

  // Add points to customer account
  async addPoints(
    customerId: string,
    points: number,
    reason: string,
    orderId?: string,
    campaignId?: string
  ): Promise<LoyaltyTransaction> {
    const transaction: LoyaltyTransaction = {
      id: this.generateId(),
      customerId,
      type: 'EARNED',
      points,
      reason,
      orderId,
      campaignId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    };

    // Emit event for real-time updates
    this.emit('pointsEarned', transaction);

    // Update customer points in database
    await this.updateCustomerPoints(customerId, points);

    return transaction;
  }

  // Redeem points for reward
  async redeemPoints(
    customerId: string,
    rewardId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; transaction?: LoyaltyTransaction; error?: string }> {
    const reward = this.rewards.get(rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (!reward.isActive) {
      return { success: false, error: 'Reward is not active' };
    }

    if (reward.validTo && new Date() > reward.validTo) {
      return { success: false, error: 'Reward has expired' };
    }

    if (reward.usageLimit && reward.usedCount >= reward.usageLimit) {
      return { success: false, error: 'Reward usage limit reached' };
    }

    const totalPointsRequired = reward.pointsRequired * quantity;
    const customerPoints = await this.getCustomerPoints(customerId);

    if (customerPoints < totalPointsRequired) {
      return { success: false, error: 'Insufficient points' };
    }

    const transaction: LoyaltyTransaction = {
      id: this.generateId(),
      customerId,
      type: 'REDEEMED',
      points: -totalPointsRequired,
      reason: `Redeemed ${quantity}x ${reward.name}`,
      productId: rewardId,
      createdAt: new Date()
    };

    // Emit event for real-time updates
    this.emit('pointsRedeemed', transaction);

    // Update customer points and reward usage
    await this.updateCustomerPoints(customerId, -totalPointsRequired);
    await this.updateRewardUsage(rewardId, quantity);

    return { success: true, transaction };
  }

  // Get available rewards for customer
  getAvailableRewards(customerId: string, customerTier?: string): LoyaltyReward[] {
    const customerPoints = this.getCustomerPoints(customerId);
    const tier = customerTier || this.getCustomerTier(customerId).id;

    return Array.from(this.rewards.values()).filter(reward => {
      if (!reward.isActive) return false;
      if (reward.validTo && new Date() > reward.validTo) return false;
      if (reward.usageLimit && reward.usedCount >= reward.usageLimit) return false;
      if (reward.pointsRequired > customerPoints) return false;
      
      // Check tier restrictions if any
      return true;
    });
  }

  // Get customer's loyalty analytics
  async getCustomerAnalytics(customerId: string): Promise<{
    points: LoyaltyPoints;
    tier: LoyaltyTier;
    transactions: LoyaltyTransaction[];
    availableRewards: LoyaltyReward[];
    nextTier?: LoyaltyTier;
    pointsToNextTier: number;
  }> {
    const points = await this.getCustomerPointsData(customerId);
    const tier = this.getCustomerTier(customerId);
    const transactions = await this.getCustomerTransactions(customerId);
    const availableRewards = this.getAvailableRewards(customerId);
    
    // Find next tier
    const nextTier = this.getNextTier(tier.id);
    const pointsToNextTier = nextTier ? nextTier.minPoints - points.points : 0;

    return {
      points,
      tier,
      transactions,
      availableRewards,
      nextTier,
      pointsToNextTier
    };
  }

  // Get system-wide loyalty analytics
  async getSystemAnalytics(): Promise<LoyaltyAnalytics> {
    // This would typically aggregate data from database
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      averagePointsPerCustomer: 0,
      redemptionRate: 0,
      tierDistribution: {},
      topRewards: [],
      monthlyTrends: []
    };
  }

  // Create loyalty campaign
  createCampaign(campaign: Omit<LoyaltyCampaign, 'id' | 'usedCount'>): LoyaltyCampaign {
    const newCampaign: LoyaltyCampaign = {
      ...campaign,
      id: this.generateId(),
      usedCount: 0
    };

    this.campaigns.set(newCampaign.id, newCampaign);
    this.emit('campaignCreated', newCampaign);

    return newCampaign;
  }

  // Create loyalty reward
  createReward(reward: Omit<LoyaltyReward, 'id' | 'usedCount'>): LoyaltyReward {
    const newReward: LoyaltyReward = {
      ...reward,
      id: this.generateId(),
      usedCount: 0
    };

    this.rewards.set(newReward.id, newReward);
    this.emit('rewardCreated', newReward);

    return newReward;
  }

  // Check if campaign is valid
  private isCampaignValid(campaign: LoyaltyCampaign): boolean {
    if (!campaign.isActive) return false;
    if (new Date() < campaign.validFrom) return false;
    if (campaign.validTo && new Date() > campaign.validTo) return false;
    if (campaign.usageLimit && campaign.usedCount >= campaign.usageLimit) return false;
    return true;
  }

  // Get next tier
  private getNextTier(currentTierId: string): LoyaltyTier | undefined {
    const tiers = Array.from(this.tiers.values()).sort((a, b) => a.minPoints - b.minPoints);
    const currentIndex = tiers.findIndex(tier => tier.id === currentTierId);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : undefined;
  }

  // Generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Database operations (would integrate with Prisma)
  private async updateCustomerPoints(customerId: string, points: number): Promise<void> {
    // Update customer points in database
    logger.debug({
      message: 'Updating customer points',
      context: { service: 'EnhancedLoyaltySystem', operation: 'updateCustomerPoints', customerId, points }
    });
  }

  private async getCustomerPoints(customerId: string): Promise<number> {
    // Get customer points from database
    return 0; // Placeholder
  }

  private async getCustomerPointsData(customerId: string): Promise<LoyaltyPoints> {
    // Get customer points data from database
    return {
      id: this.generateId(),
      customerId,
      points: 0,
      tier: 'bronze',
      totalEarned: 0,
      totalRedeemed: 0,
      lastActivity: new Date()
    };
  }

  private async getCustomerTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
    // Get customer transactions from database
    return [];
  }

  private async updateRewardUsage(rewardId: string, quantity: number): Promise<void> {
    // Update reward usage count in database
    logger.debug({
      message: 'Updating reward usage',
      context: { service: 'EnhancedLoyaltySystem', operation: 'updateRewardUsage', rewardId, quantity }
    });
  }

  // Get all tiers
  getAllTiers(): LoyaltyTier[] {
    return Array.from(this.tiers.values());
  }

  // Get all rewards
  getAllRewards(): LoyaltyReward[] {
    return Array.from(this.rewards.values());
  }

  // Get all campaigns
  getAllCampaigns(): LoyaltyCampaign[] {
    return Array.from(this.campaigns.values());
  }
}

// Singleton instance
export const enhancedLoyaltySystem = new EnhancedLoyaltySystem();

// Enhanced Loyalty System for SmartStore SaaS
export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  color: string;
  icon: string;
  multiplier: number; // Points multiplier for this tier
}

export interface LoyaltyPoints {
  id: string;
  customerId: string;
  points: number;
  tier: string;
  totalEarned: number;
  totalRedeemed: number;
  lastActivity: Date;
  expiresAt?: Date;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
  points: number;
  reason: string;
  orderId?: string;
  productId?: string;
  campaignId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: 'DISCOUNT' | 'FREE_SHIPPING' | 'PRODUCT' | 'CASHBACK';
  value: number; // Discount percentage, cashback amount, etc.
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  usageLimit?: number;
  usedCount: number;
  image?: string;
  category: string;
}

export interface LoyaltyCampaign {
  id: string;
  name: string;
  description: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'PURCHASE' | 'REFERRAL' | 'REVIEW' | 'SOCIAL_SHARE';
  pointsMultiplier: number;
  bonusPoints: number;
  conditions: {
    minOrderValue?: number;
    minOrderCount?: number;
    productCategories?: string[];
    customerTiers?: string[];
  };
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
}

export interface LoyaltyAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerCustomer: number;
  redemptionRate: number;
  tierDistribution: Record<string, number>;
  topRewards: Array<{
    rewardId: string;
    name: string;
    redemptionCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    pointsEarned: number;
    pointsRedeemed: number;
    newCustomers: number;
  }>;
}

// Default loyalty tiers
const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    benefits: ['1x Points on purchases', 'Basic support'],
    color: '#CD7F32',
    icon: '🥉',
    multiplier: 1.0
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    benefits: ['1.2x Points on purchases', 'Priority support', 'Free shipping on orders over LKR 3000'],
    color: '#C0C0C0',
    icon: '🥈',
    multiplier: 1.2
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 9999,
    benefits: ['1.5x Points on purchases', 'VIP support', 'Free shipping on all orders', 'Early access to sales'],
    color: '#FFD700',
    icon: '🥇',
    multiplier: 1.5
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minPoints: 10000,
    benefits: ['2x Points on purchases', 'Concierge support', 'Free shipping on all orders', 'Exclusive products', 'Personal shopping assistant'],
    color: '#E5E4E2',
    icon: '💎',
    multiplier: 2.0
  }
];

export class EnhancedLoyaltySystem extends EventEmitter {
  private tiers: Map<string, LoyaltyTier> = new Map();
  private rewards: Map<string, LoyaltyReward> = new Map();
  private campaigns: Map<string, LoyaltyCampaign> = new Map();

  constructor() {
    super();
    this.initializeTiers();
  }

  private initializeTiers() {
    DEFAULT_TIERS.forEach(tier => {
      this.tiers.set(tier.id, tier);
    });
  }

  // Calculate points for a purchase
  calculatePoints(
    customerId: string,
    orderValue: number,
    orderItems: Array<{ category: string; value: number }>,
    appliedCampaigns: string[] = []
  ): number {
    const customerTier = this.getCustomerTier(customerId);
    const basePoints = Math.floor(orderValue / 100); // 1 point per LKR 100
    
    // Apply tier multiplier
    let totalPoints = Math.floor(basePoints * customerTier.multiplier);
    
    // Apply campaign bonuses
    appliedCampaigns.forEach(campaignId => {
      const campaign = this.campaigns.get(campaignId);
      if (campaign && this.isCampaignValid(campaign)) {
        totalPoints += campaign.bonusPoints;
        totalPoints = Math.floor(totalPoints * campaign.pointsMultiplier);
      }
    });
    
    return totalPoints;
  }

  // Get customer's current tier
  getCustomerTier(customerId: string): LoyaltyTier {
    // This would typically fetch from database
    // For now, return Bronze tier as default
    return this.tiers.get('bronze')!;
  }

  // Add points to customer account
  async addPoints(
    customerId: string,
    points: number,
    reason: string,
    orderId?: string,
    campaignId?: string
  ): Promise<LoyaltyTransaction> {
    const transaction: LoyaltyTransaction = {
      id: this.generateId(),
      customerId,
      type: 'EARNED',
      points,
      reason,
      orderId,
      campaignId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    };

    // Emit event for real-time updates
    this.emit('pointsEarned', transaction);

    // Update customer points in database
    await this.updateCustomerPoints(customerId, points);

    return transaction;
  }

  // Redeem points for reward
  async redeemPoints(
    customerId: string,
    rewardId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; transaction?: LoyaltyTransaction; error?: string }> {
    const reward = this.rewards.get(rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (!reward.isActive) {
      return { success: false, error: 'Reward is not active' };
    }

    if (reward.validTo && new Date() > reward.validTo) {
      return { success: false, error: 'Reward has expired' };
    }

    if (reward.usageLimit && reward.usedCount >= reward.usageLimit) {
      return { success: false, error: 'Reward usage limit reached' };
    }

    const totalPointsRequired = reward.pointsRequired * quantity;
    const customerPoints = await this.getCustomerPoints(customerId);

    if (customerPoints < totalPointsRequired) {
      return { success: false, error: 'Insufficient points' };
    }

    const transaction: LoyaltyTransaction = {
      id: this.generateId(),
      customerId,
      type: 'REDEEMED',
      points: -totalPointsRequired,
      reason: `Redeemed ${quantity}x ${reward.name}`,
      productId: rewardId,
      createdAt: new Date()
    };

    // Emit event for real-time updates
    this.emit('pointsRedeemed', transaction);

    // Update customer points and reward usage
    await this.updateCustomerPoints(customerId, -totalPointsRequired);
    await this.updateRewardUsage(rewardId, quantity);

    return { success: true, transaction };
  }

  // Get available rewards for customer
  getAvailableRewards(customerId: string, customerTier?: string): LoyaltyReward[] {
    const customerPoints = this.getCustomerPoints(customerId);
    const tier = customerTier || this.getCustomerTier(customerId).id;

    return Array.from(this.rewards.values()).filter(reward => {
      if (!reward.isActive) return false;
      if (reward.validTo && new Date() > reward.validTo) return false;
      if (reward.usageLimit && reward.usedCount >= reward.usageLimit) return false;
      if (reward.pointsRequired > customerPoints) return false;
      
      // Check tier restrictions if any
      return true;
    });
  }

  // Get customer's loyalty analytics
  async getCustomerAnalytics(customerId: string): Promise<{
    points: LoyaltyPoints;
    tier: LoyaltyTier;
    transactions: LoyaltyTransaction[];
    availableRewards: LoyaltyReward[];
    nextTier?: LoyaltyTier;
    pointsToNextTier: number;
  }> {
    const points = await this.getCustomerPointsData(customerId);
    const tier = this.getCustomerTier(customerId);
    const transactions = await this.getCustomerTransactions(customerId);
    const availableRewards = this.getAvailableRewards(customerId);
    
    // Find next tier
    const nextTier = this.getNextTier(tier.id);
    const pointsToNextTier = nextTier ? nextTier.minPoints - points.points : 0;

    return {
      points,
      tier,
      transactions,
      availableRewards,
      nextTier,
      pointsToNextTier
    };
  }

  // Get system-wide loyalty analytics
  async getSystemAnalytics(): Promise<LoyaltyAnalytics> {
    // This would typically aggregate data from database
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      averagePointsPerCustomer: 0,
      redemptionRate: 0,
      tierDistribution: {},
      topRewards: [],
      monthlyTrends: []
    };
  }

  // Create loyalty campaign
  createCampaign(campaign: Omit<LoyaltyCampaign, 'id' | 'usedCount'>): LoyaltyCampaign {
    const newCampaign: LoyaltyCampaign = {
      ...campaign,
      id: this.generateId(),
      usedCount: 0
    };

    this.campaigns.set(newCampaign.id, newCampaign);
    this.emit('campaignCreated', newCampaign);

    return newCampaign;
  }

  // Create loyalty reward
  createReward(reward: Omit<LoyaltyReward, 'id' | 'usedCount'>): LoyaltyReward {
    const newReward: LoyaltyReward = {
      ...reward,
      id: this.generateId(),
      usedCount: 0
    };

    this.rewards.set(newReward.id, newReward);
    this.emit('rewardCreated', newReward);

    return newReward;
  }

  // Check if campaign is valid
  private isCampaignValid(campaign: LoyaltyCampaign): boolean {
    if (!campaign.isActive) return false;
    if (new Date() < campaign.validFrom) return false;
    if (campaign.validTo && new Date() > campaign.validTo) return false;
    if (campaign.usageLimit && campaign.usedCount >= campaign.usageLimit) return false;
    return true;
  }

  // Get next tier
  private getNextTier(currentTierId: string): LoyaltyTier | undefined {
    const tiers = Array.from(this.tiers.values()).sort((a, b) => a.minPoints - b.minPoints);
    const currentIndex = tiers.findIndex(tier => tier.id === currentTierId);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : undefined;
  }

  // Generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Database operations (would integrate with Prisma)
  private async updateCustomerPoints(customerId: string, points: number): Promise<void> {
    // Update customer points in database
    logger.debug({
      message: 'Updating customer points',
      context: { service: 'EnhancedLoyaltySystem', operation: 'updateCustomerPoints', customerId, points }
    });
  }

  private async getCustomerPoints(customerId: string): Promise<number> {
    // Get customer points from database
    return 0; // Placeholder
  }

  private async getCustomerPointsData(customerId: string): Promise<LoyaltyPoints> {
    // Get customer points data from database
    return {
      id: this.generateId(),
      customerId,
      points: 0,
      tier: 'bronze',
      totalEarned: 0,
      totalRedeemed: 0,
      lastActivity: new Date()
    };
  }

  private async getCustomerTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
    // Get customer transactions from database
    return [];
  }

  private async updateRewardUsage(rewardId: string, quantity: number): Promise<void> {
    // Update reward usage count in database
    logger.debug({
      message: 'Updating reward usage',
      context: { service: 'EnhancedLoyaltySystem', operation: 'updateRewardUsage', rewardId, quantity }
    });
  }

  // Get all tiers
  getAllTiers(): LoyaltyTier[] {
    return Array.from(this.tiers.values());
  }

  // Get all rewards
  getAllRewards(): LoyaltyReward[] {
    return Array.from(this.rewards.values());
  }

  // Get all campaigns
  getAllCampaigns(): LoyaltyCampaign[] {
    return Array.from(this.campaigns.values());
  }
}

// Singleton instance
export const enhancedLoyaltySystem = new EnhancedLoyaltySystem();

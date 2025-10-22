'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Gift, Star, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LoyaltyData {
  loyalty: {
    id: string;
    points: number;
    tier: string;
    totalSpent: number;
    totalOrders: number;
    lastOrderDate?: string;
    tierExpiryDate?: string;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    points: number;
    reason: string;
    createdAt: string;
    order?: {
      id: string;
      orderNumber: string;
      total: number;
    };
    product?: {
      id: string;
      name: string;
      price: number;
    };
    campaign?: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    description?: string;
    pointsRequired: number;
    type: string;
    value: number;
    image?: string;
    category?: string;
  }>;
}

interface LoyaltyDashboardProps {
  customerId: string;
}

export default function LoyaltyDashboard({ customerId }: LoyaltyDashboardProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/loyalty?customerId=${customerId}`);
      const data = await response.json();
      setLoyaltyData(data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      const reward = loyaltyData?.availableRewards.find(r => r.id === rewardId);
      if (!reward) return;

      const response = await fetch('/api/loyalty', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          rewardId,
          points: reward.pointsRequired
        }),
      });

      if (response.ok) {
        fetchLoyaltyData(); // Refresh data
        setSelectedReward(null);
        alert('Reward redeemed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Failed to redeem reward');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'text-amber-600';
      case 'SILVER': return 'text-gray-400';
      case 'GOLD': return 'text-yellow-500';
      case 'PLATINUM': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return '🥉';
      case 'SILVER': return '🥈';
      case 'GOLD': return '🥇';
      case 'PLATINUM': return '💎';
      default: return '⭐';
    }
  };

  const getNextTierPoints = (currentTier: string, currentPoints: number) => {
    const tiers = {
      'BRONZE': 0,
      'SILVER': 1000,
      'GOLD': 2500,
      'PLATINUM': 5000
    };
    
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex < tierOrder.length - 1) {
      const nextTier = tierOrder[currentIndex + 1];
      const nextTierPoints = tiers[nextTier as keyof typeof tiers];
      return { nextTier, pointsNeeded: nextTierPoints - currentPoints };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎁</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No loyalty data found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start shopping to earn loyalty points!
        </p>
      </div>
    );
  }

  const { loyalty, recentTransactions, availableRewards } = loyaltyData;
  const nextTier = getNextTierPoints(loyalty.tier, loyalty.points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Loyalty Program
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTierIcon(loyalty.tier)}</span>
          <span className={`text-lg font-semibold ${getTierColor(loyalty.tier)}`}>
            {loyalty.tier} Member
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.points.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(loyalty.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tier</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.tier}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progress to {nextTier.nextTier} Tier
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {loyalty.points.toLocaleString()} points
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {nextTier.pointsNeeded.toLocaleString()} more needed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((loyalty.points / (loyalty.points + nextTier.pointsNeeded)) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'EARNED' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'EARNED' ? (
                        <Star className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.type === 'EARNED' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'EARNED' ? '+' : '-'}{Math.abs(transaction.points)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Rewards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Rewards
          </h3>
          {availableRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No rewards available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {reward.image ? (
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reward.name}
                      </p>
                      {reward.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {reward.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {reward.pointsRequired} pts
                    </p>
                    <button
                      onClick={() => redeemReward(reward.id)}
                      disabled={loyalty.points < reward.pointsRequired}
                      className={`text-xs px-3 py-1 rounded-full ${
                        loyalty.points >= reward.pointsRequired
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loyalty.points >= reward.pointsRequired ? 'Redeem' : 'Insufficient Points'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LoyaltyData {
  loyalty: {
    id: string;
    points: number;
    tier: string;
    totalSpent: number;
    totalOrders: number;
    lastOrderDate?: string;
    tierExpiryDate?: string;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    points: number;
    reason: string;
    createdAt: string;
    order?: {
      id: string;
      orderNumber: string;
      total: number;
    };
    product?: {
      id: string;
      name: string;
      price: number;
    };
    campaign?: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    description?: string;
    pointsRequired: number;
    type: string;
    value: number;
    image?: string;
    category?: string;
  }>;
}

interface LoyaltyDashboardProps {
  customerId: string;
}

export default function LoyaltyDashboard({ customerId }: LoyaltyDashboardProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/loyalty?customerId=${customerId}`);
      const data = await response.json();
      setLoyaltyData(data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      const reward = loyaltyData?.availableRewards.find(r => r.id === rewardId);
      if (!reward) return;

      const response = await fetch('/api/loyalty', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          rewardId,
          points: reward.pointsRequired
        }),
      });

      if (response.ok) {
        fetchLoyaltyData(); // Refresh data
        setSelectedReward(null);
        alert('Reward redeemed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Failed to redeem reward');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'text-amber-600';
      case 'SILVER': return 'text-gray-400';
      case 'GOLD': return 'text-yellow-500';
      case 'PLATINUM': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return '🥉';
      case 'SILVER': return '🥈';
      case 'GOLD': return '🥇';
      case 'PLATINUM': return '💎';
      default: return '⭐';
    }
  };

  const getNextTierPoints = (currentTier: string, currentPoints: number) => {
    const tiers = {
      'BRONZE': 0,
      'SILVER': 1000,
      'GOLD': 2500,
      'PLATINUM': 5000
    };
    
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex < tierOrder.length - 1) {
      const nextTier = tierOrder[currentIndex + 1];
      const nextTierPoints = tiers[nextTier as keyof typeof tiers];
      return { nextTier, pointsNeeded: nextTierPoints - currentPoints };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎁</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No loyalty data found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start shopping to earn loyalty points!
        </p>
      </div>
    );
  }

  const { loyalty, recentTransactions, availableRewards } = loyaltyData;
  const nextTier = getNextTierPoints(loyalty.tier, loyalty.points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Loyalty Program
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTierIcon(loyalty.tier)}</span>
          <span className={`text-lg font-semibold ${getTierColor(loyalty.tier)}`}>
            {loyalty.tier} Member
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.points.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(loyalty.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tier</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.tier}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progress to {nextTier.nextTier} Tier
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {loyalty.points.toLocaleString()} points
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {nextTier.pointsNeeded.toLocaleString()} more needed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((loyalty.points / (loyalty.points + nextTier.pointsNeeded)) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'EARNED' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'EARNED' ? (
                        <Star className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.type === 'EARNED' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'EARNED' ? '+' : '-'}{Math.abs(transaction.points)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Rewards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Rewards
          </h3>
          {availableRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No rewards available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {reward.image ? (
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reward.name}
                      </p>
                      {reward.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {reward.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {reward.pointsRequired} pts
                    </p>
                    <button
                      onClick={() => redeemReward(reward.id)}
                      disabled={loyalty.points < reward.pointsRequired}
                      className={`text-xs px-3 py-1 rounded-full ${
                        loyalty.points >= reward.pointsRequired
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loyalty.points >= reward.pointsRequired ? 'Redeem' : 'Insufficient Points'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LoyaltyData {
  loyalty: {
    id: string;
    points: number;
    tier: string;
    totalSpent: number;
    totalOrders: number;
    lastOrderDate?: string;
    tierExpiryDate?: string;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    points: number;
    reason: string;
    createdAt: string;
    order?: {
      id: string;
      orderNumber: string;
      total: number;
    };
    product?: {
      id: string;
      name: string;
      price: number;
    };
    campaign?: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    description?: string;
    pointsRequired: number;
    type: string;
    value: number;
    image?: string;
    category?: string;
  }>;
}

interface LoyaltyDashboardProps {
  customerId: string;
}

export default function LoyaltyDashboard({ customerId }: LoyaltyDashboardProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/loyalty?customerId=${customerId}`);
      const data = await response.json();
      setLoyaltyData(data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      const reward = loyaltyData?.availableRewards.find(r => r.id === rewardId);
      if (!reward) return;

      const response = await fetch('/api/loyalty', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          rewardId,
          points: reward.pointsRequired
        }),
      });

      if (response.ok) {
        fetchLoyaltyData(); // Refresh data
        setSelectedReward(null);
        alert('Reward redeemed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Failed to redeem reward');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'text-amber-600';
      case 'SILVER': return 'text-gray-400';
      case 'GOLD': return 'text-yellow-500';
      case 'PLATINUM': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return '🥉';
      case 'SILVER': return '🥈';
      case 'GOLD': return '🥇';
      case 'PLATINUM': return '💎';
      default: return '⭐';
    }
  };

  const getNextTierPoints = (currentTier: string, currentPoints: number) => {
    const tiers = {
      'BRONZE': 0,
      'SILVER': 1000,
      'GOLD': 2500,
      'PLATINUM': 5000
    };
    
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex < tierOrder.length - 1) {
      const nextTier = tierOrder[currentIndex + 1];
      const nextTierPoints = tiers[nextTier as keyof typeof tiers];
      return { nextTier, pointsNeeded: nextTierPoints - currentPoints };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎁</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No loyalty data found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start shopping to earn loyalty points!
        </p>
      </div>
    );
  }

  const { loyalty, recentTransactions, availableRewards } = loyaltyData;
  const nextTier = getNextTierPoints(loyalty.tier, loyalty.points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Loyalty Program
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTierIcon(loyalty.tier)}</span>
          <span className={`text-lg font-semibold ${getTierColor(loyalty.tier)}`}>
            {loyalty.tier} Member
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.points.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(loyalty.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tier</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loyalty.tier}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progress to {nextTier.nextTier} Tier
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {loyalty.points.toLocaleString()} points
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {nextTier.pointsNeeded.toLocaleString()} more needed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((loyalty.points / (loyalty.points + nextTier.pointsNeeded)) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'EARNED' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'EARNED' ? (
                        <Star className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.type === 'EARNED' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'EARNED' ? '+' : '-'}{Math.abs(transaction.points)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Rewards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Rewards
          </h3>
          {availableRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No rewards available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {reward.image ? (
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reward.name}
                      </p>
                      {reward.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {reward.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {reward.pointsRequired} pts
                    </p>
                    <button
                      onClick={() => redeemReward(reward.id)}
                      disabled={loyalty.points < reward.pointsRequired}
                      className={`text-xs px-3 py-1 rounded-full ${
                        loyalty.points >= reward.pointsRequired
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loyalty.points >= reward.pointsRequired ? 'Redeem' : 'Insufficient Points'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoyaltyProgram {
  id: string;
  customerId: string;
  customerName: string;
  points: number;
  tier: string;
  lifetimePoints: number;
}

export default function LoyaltyPage() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLoyaltyPrograms(); }, []);

  const fetchLoyaltyPrograms = async () => {
    try {
      const res = await fetch('/api/loyalty');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || data.data || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching loyalty programs',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
    finally { setLoading(false); }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'SILVER': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="w-8 h-8" />Customer Loyalty & Rewards
        </h1>
      </div>

      {/* Tier Overview */}
      <div className="grid grid-cols-4 gap-4">
        {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier, idx) => (
          <div key={tier} className={`p-6 rounded-lg border-2 ${getTierColor(tier)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6" />
              <h3 className="font-bold">{tier}</h3>
            </div>
            <p className="text-sm">
              {idx === 0 && '0-999 points'}
              {idx === 1 && '1,000-4,999 points'}
              {idx === 2 && '5,000-9,999 points'}
              {idx === 3 && '10,000+ points'}
            </p>
            <p className="text-xs mt-2">
              {idx === 0 && '1x points, 0% discount'}
              {idx === 1 && '1.5x points, 5% discount'}
              {idx === 2 && '2x points, 10% discount'}
              {idx === 3 && '3x points, 15% discount'}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lifetime Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No loyalty programs yet. Points will be awarded automatically with customer orders.
                  </td>
                </tr>
              ) : (
                programs.map(program => (
                  <tr key={program.id}>
                    <td className="px-6 py-4">{program.customerName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded border ${getTierColor(program.tier)}`}>
                        {program.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{program.points.toLocaleString()}</td>
                    <td className="px-6 py-4">{program.lifetimePoints.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline">View History</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


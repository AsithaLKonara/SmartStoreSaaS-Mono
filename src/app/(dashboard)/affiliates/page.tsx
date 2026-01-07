'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { logger } from '@/lib/logger';
import {
  Users,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  Award,
  Copy
} from 'lucide-react';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  commissionRate: number;
  totalSales: number;
  totalCommission: number;
  unpaidCommission: number;
  referrals: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/affiliates');
      
      if (response.ok) {
        const data = await response.json();
        setAffiliates(data.affiliates || []);
      } else {
        // Mock data
        setAffiliates([
          {
            id: 'aff_001',
            name: 'Sarah Marketing',
            email: 'sarah@example.com',
            referralCode: 'SARAH2024',
            commissionRate: 10,
            totalSales: 50000,
            totalCommission: 5000,
            unpaidCommission: 1500,
            referrals: 25,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          },
          {
            id: 'aff_002',
            name: 'Tech Blogger Pro',
            email: 'tech@example.com',
            referralCode: 'TECHPRO',
            commissionRate: 15,
            totalSales: 120000,
            totalCommission: 18000,
            unpaidCommission: 3500,
            referrals: 48,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching affiliates',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (affiliateId: string, amount: number) => {
    if (!confirm(`Process payment of රු ${amount.toFixed(2)}?`)) return;

    try {
      const response = await fetch(`/api/affiliates/${affiliateId}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        alert('Payment processed successfully!');
        fetchAffiliates();
      } else {
        alert('Failed to process payment');
      }
    } catch (error) {
      alert('Error processing payment');
    }
  };

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/shop?ref=${code}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === 'ACTIVE').length,
    totalSales: affiliates.reduce((sum, a) => sum + a.totalSales, 0),
    totalCommissions: affiliates.reduce((sum, a) => sum + a.totalCommission, 0),
    unpaidCommissions: affiliates.reduce((sum, a) => sum + a.unpaidCommission, 0),
    totalReferrals: affiliates.reduce((sum, a) => sum + a.referrals, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Affiliates Program</h1>
          <p className="text-gray-400 mt-2">
            Manage affiliate partners and track commissions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Users className="w-4 h-4 mr-2" />
          Add Affiliate
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.totalAffiliates}</p>
              <p className="text-sm text-gray-400 mt-1">Total Affiliates</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.activeAffiliates}</p>
              <p className="text-sm text-gray-400 mt-1">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalReferrals}</p>
              <p className="text-sm text-gray-400 mt-1">Referrals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                රු {(stats.totalSales / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-gray-400 mt-1">Total Sales</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                රු {(stats.totalCommissions / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-gray-400 mt-1">Paid Out</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                රු {(stats.unpaidCommissions / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-gray-400 mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Affiliate Partners
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage your affiliate network and process payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : affiliates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Affiliate</TableHead>
                    <TableHead className="text-gray-400">Referral Code</TableHead>
                    <TableHead className="text-gray-400">Commission</TableHead>
                    <TableHead className="text-gray-400">Sales</TableHead>
                    <TableHead className="text-gray-400">Earned</TableHead>
                    <TableHead className="text-gray-400">Unpaid</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id} className="border-gray-700">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{affiliate.name}</p>
                          <p className="text-sm text-gray-400">{affiliate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-blue-400 bg-gray-900/50 px-2 py-1 rounded">
                            {affiliate.referralCode}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyReferralLink(affiliate.referralCode)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        {affiliate.commissionRate}%
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div>
                          <p className="font-medium">රු {affiliate.totalSales.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{affiliate.referrals} referrals</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">
                        රු {affiliate.totalCommission.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-yellow-400 font-medium">
                        රු {affiliate.unpaidCommission.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={affiliate.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {affiliate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {affiliate.unpaidCommission > 0 && (
                          <Button
                            size="sm"
                            onClick={() => processPayment(affiliate.id, affiliate.unpaidCommission)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Pay Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No affiliates yet</p>
              <p className="text-sm mt-2">Add affiliates to start your referral program</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                Add Your First Affiliate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


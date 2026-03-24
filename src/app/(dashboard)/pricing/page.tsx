'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Search,
    Zap,
    RefreshCw,
    ArrowRight,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface PricingRecommendation {
    productId: string;
    productName: string;
    sku: string;
    currentPrice: number;
    recommendedPrice: number;
    reason: string;
    impact: 'POSITIVE' | 'NEUTRAL';
}

export default function PricingOptimizationPage() {
    const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);

    const fetchRecommendations = async () => {
        setLoading(true);
        const toastId = toast.loading('AI is calculating optimal prices...');
        try {
            const res = await fetch('/api/pricing/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'analyze' })
            });
            const data = await res.json();
            if (res.ok) {
                setRecommendations(data.data.recommendations || []);
                toast.success('Analysis complete!', { id: toastId });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error('Failed to optimize pricing', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const applyAll = async () => {
        setApplying(true);
        const toastId = toast.loading('Applying AI price adjustments...');
        try {
            const res = await fetch('/api/pricing/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'apply' })
            });
            if (res.ok) {
                toast.success('All prices updated successfully!', { id: toastId });
                setRecommendations([]); // Clear after apply
            } else {
                throw new Error('Apply failed');
            }
        } catch (error) {
            toast.error('Failed to apply prices', { id: toastId });
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        Dynamic Pricing Engine
                    </h1>
                    <p className="text-gray-500 mt-1">AI-driven margin optimization and demand-based pricing</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchRecommendations}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Re-analyze Market
                    </Button>
                    {recommendations.length > 0 && (
                        <Button
                            onClick={applyAll}
                            disabled={applying}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {applying ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            Apply All Adjustments
                        </Button>
                    )}
                </div>
            </div>

            {recommendations.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="p-4 glass-dark rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <DollarSign className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700">Ready for Optimization?</h2>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        Run the AI analysis to identify products that are underpriced or eligible for premium pricing based on current demand velocity.
                    </p>
                    <Button onClick={fetchRecommendations} className="mt-6 bg-slate-900">
                        Start AI Price Audit
                    </Button>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {recommendations.map((rec) => (
                        <Card key={rec.productId} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{rec.productName}</CardTitle>
                                <span className="text-[10px] font-mono text-slate-400">{rec.sku}</span>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current</p>
                                        <p className="text-lg font-semibold text-slate-400 line-through">{formatCurrency(rec.currentPrice)}</p>
                                    </div>
                                    <ArrowRight className="text-slate-300 w-5 h-5 mt-4" />
                                    <div className="flex-1">
                                        <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Recommended</p>
                                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(rec.recommendedPrice)}</p>
                                    </div>
                                    <div className={`p-2 rounded-xl flex items-center gap-1 ${rec.recommendedPrice > rec.currentPrice ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {rec.recommendedPrice > rec.currentPrice ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        <span className="text-xs font-bold">
                                            {Math.abs(((rec.recommendedPrice - rec.currentPrice) / rec.currentPrice) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl flex gap-3 items-start border border-slate-100">
                                    <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        <span className="font-bold text-slate-900">AI Logic:</span> {rec.reason}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

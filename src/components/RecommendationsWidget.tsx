'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Sparkles, TrendingUp } from 'lucide-react';

interface Recommendation {
    productId: string;
    productName: string;
    reason: string;
    confidence: number;
}

export function RecommendationsWidget({
    customerId,
    organizationId
}: {
    customerId?: string;
    organizationId?: string;
}) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadRecommendations() {
            try {
                const queryParams = new URLSearchParams();
                if (customerId) queryParams.append('customerId', customerId);
                if (organizationId) queryParams.append('organizationId', organizationId);

                const response = await fetch(`/api/recommendations?${queryParams.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to load recommendations');
                }

                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } catch (error) {
                console.error('Failed to load recommendations:', error);
                setError('Unable to load recommendations');
            } finally {
                setLoading(false);
            }
        }

        loadRecommendations();
    }, [customerId]);

    if (loading) {
        return (
            <Card className="glass-dark border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Recommended for You
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || recommendations.length === 0) {
        return null;
    }

    return (
        <Card className="glass-dark border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-shadow-glow">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Recommended for You
                </CardTitle>
                <p className="text-sm text-slate-400">
                    Based on your purchase history and preferences
                </p>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec) => (
                        <Link
                            key={rec.productId}
                            href={`/products/${rec.productId}`}
                            className="group relative overflow-hidden glass border border-white/5 rounded-lg p-4 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                                    {rec.productName}
                                </h3>
                                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                            </div>
                            <p className="text-sm text-slate-400 mb-3 group-hover:text-slate-300 transition-colors">
                                {rec.reason}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                                    {Math.round(rec.confidence * 100)}% match
                                </span>
                                <span className="text-xs text-slate-500 group-hover:text-primary transition-colors">
                                    View details →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

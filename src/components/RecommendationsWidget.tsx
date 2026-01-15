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

export function RecommendationsWidget({ customerId }: { customerId?: string }) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadRecommendations() {
            try {
                const params = customerId ? `?customerId=${customerId}` : '';
                const response = await fetch(`/api/recommendations${params}`);

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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Recommended for You
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || recommendations.length === 0) {
        return null;
    }

    return (
        <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Recommended for You
                </CardTitle>
                <p className="text-sm text-gray-500">
                    Based on your purchase history and preferences
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec) => (
                        <Link
                            key={rec.productId}
                            href={`/products/${rec.productId}`}
                            className="group border rounded-lg p-4 hover:shadow-lg hover:border-purple-300 transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                    {rec.productName}
                                </h3>
                                <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {rec.reason}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                    {Math.round(rec.confidence * 100)}% match
                                </span>
                                <span className="text-xs text-gray-500 group-hover:text-purple-600 transition-colors">
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

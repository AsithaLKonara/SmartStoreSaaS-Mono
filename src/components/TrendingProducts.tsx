'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Flame } from 'lucide-react';

interface TrendingProduct {
    productId: string;
    productName: string;
    reason: string;
    confidence: number;
}

export function TrendingProducts({ limit = 10 }: { limit?: number }) {
    const [products, setProducts] = useState<TrendingProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTrending() {
            try {
                const response = await fetch(`/api/recommendations/trending?limit=${limit}`);
                const data = await response.json();
                setProducts(data.trending || []);
            } catch (error) {
                console.error('Failed to load trending products:', error);
            } finally {
                setLoading(false);
            }
        }

        loadTrending();
    }, [limit]);

    if (loading || products.length === 0) {
        return null;
    }

    return (
        <Card className="glass-dark border-accent/20 shadow-lg shadow-accent/5">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-shadow-glow">
                    <Flame className="w-5 h-5 text-accent" />
                    Trending Now
                </CardTitle>
                <p className="text-sm text-slate-400">
                    Hot products flying off the shelves
                </p>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {products.slice(0, 5).map((product, index) => (
                        <Link
                            key={product.productId}
                            href={`/products/${product.productId}`}
                            className="group relative overflow-hidden glass border border-white/5 rounded-lg p-3 hover:shadow-xl hover:border-accent/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-accent">
                                    #{index + 1}
                                </span>
                                <Flame className="w-4 h-4 text-accent/70" />
                            </div>
                            <h4 className="font-medium text-sm text-white group-hover:text-accent transition-colors line-clamp-2">
                                {product.productName}
                            </h4>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

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
        <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Trending Now
                </CardTitle>
                <p className="text-sm text-gray-500">
                    Hot products flying off the shelves
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {products.slice(0, 5).map((product, index) => (
                        <Link
                            key={product.productId}
                            href={`/products/${product.productId}`}
                            className="group border rounded-lg p-3 hover:shadow-md hover:border-orange-300 transition-all"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-orange-500">
                                    #{index + 1}
                                </span>
                                <Flame className="w-4 h-4 text-orange-400" />
                            </div>
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-2">
                                {product.productName}
                            </h4>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrendingPage() {
  const products = await prisma.product.findMany({
    where: { 
      isMarketplacePublished: true,
      isActive: true,
      stock: { gt: 0 }
    },
    include: {
      organization: {
        select: { name: true, id: true }
      }
    },
    orderBy: { rating: 'desc' },
    take: 50
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Trending Products</h1>
        <p className="text-slate-500">The most highly-rated products from across our merchant network.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/marketplace/product/${product.id}`}
            className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <div className="aspect-square bg-slate-100 relative">
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold text-white">{product.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{product.organization.name}</p>
              <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>
              <div className="mt-auto flex items-center justify-between">
                <p className="text-lg font-black text-slate-900">${Number(product.price).toFixed(2)}</p>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

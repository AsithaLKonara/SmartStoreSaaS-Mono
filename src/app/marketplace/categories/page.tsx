import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  Laptop, 
  ShoppingBag, 
  Home, 
  Cpu, 
  Watch, 
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const CATEGORY_ICONS: Record<string, any> = {
  'Electronics': Laptop,
  'Fashion': ShoppingBag,
  'Home & Living': Home,
  'Components': Cpu,
  'Accessories': Watch,
  'Others': Package,
};

export default async function MarketplaceCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: { where: { isMarketplacePublished: true } } }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Explore by Category</h1>
        <p className="text-slate-500">Discover millions of products grouped by their global taxonomy from verified merchants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat: any) => {
          const Icon = CATEGORY_ICONS[cat.name] || Layers;
          return (
            <Link key={cat.id} href={`/marketplace?category=${cat.id}`}>
              <Card className="hover:shadow-xl transition-all duration-300 group border-slate-200 hover:border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                        <p className="text-xs text-slate-500">{(cat as any)._count.products} Marketplace Items</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Layers className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No categories found</h3>
          <p className="text-slate-500">Merchant taxonomies haven't been synchronized yet.</p>
        </div>
      )}
    </div>
  );
}

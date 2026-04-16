import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { globalPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SmartStore Global Marketplace | Discover Verified Merchants',
  description: 'The world\'s first unified commerce marketplace. Buy directly from independent verified businesses powered by SmartStore. Real-time global inventory from reliable merchants.',
  openGraph: {
    title: 'SmartStore Marketplace',
    description: 'Shop global, support local. Unified commerce at its finest.',
    type: 'website',
  }
};

export default async function MarketplaceHome() {
  let products = [];
  let dbError = false;

  try {
    products = await globalPrisma.product.findMany({
      where: { 
        isMarketplacePublished: true,
        isActive: true,
        stock: { gt: 0 }
      },
      include: {
        organization: {
          select: {
            name: true,
            logo: true,
            id: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 24
    });
  } catch (error) {
    console.error('Marketplace DB Error:', error);
    dbError = true;
  }

  return (
    <div className="w-full space-y-12">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-slate-900 overflow-hidden min-h-[400px] flex items-center shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 opacity-90 z-0"></div>
        <div className="relative z-10 p-8 lg:p-16 max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            Discover Millions of Products from verified global merchants.
          </h1>
          <p className="text-lg text-slate-300 mb-8">
            The world's first unified SaaS commerce marketplace where every purchase supports independent businesses directly from their warehouse logic.
          </p>
          <button className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/30">
            Start Shopping
          </button>
        </div>
      </div>

      {/* Featured Products Grid */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-black text-slate-900">Trending Now</h2>
          <Link href="/marketplace/trending" className="text-indigo-600 font-medium hover:underline">
            View all
          </Link>
        </div>

        {dbError ? (
          <div className="p-12 text-center border-2 border-slate-100 bg-slate-50 rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Global Catalog Temporarily Unavailable</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              We're currently experiencing a heavy load on our marketplace database. Please refresh the page in a few moments to see the latest products.
            </p>
            <Link 
              href="/marketplace" 
              className="mt-6 px-6 py-2 bg-white border border-slate-200 text-slate-900 font-bold rounded-full hover:bg-slate-100 transition-colors"
            >
              Retry Connection
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-500">Merchants haven't published any products to the marketplace yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/marketplace/product/${product.id}`}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ShoppingCart className="w-12 h-12 text-slate-400 mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">SmartStore Global</span>
                    </div>
                  </div>
                  
                  {/* Store Badge */}
                  <div className="absolute top-2 left-2 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm max-w-[90%] z-10">
                    <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                      {product.organization.logo && (
                        <Image src={product.organization.logo} alt="" width={20} height={20} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">{product.organization.name}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-700">{(product as any).rating?.toFixed(1) || '4.5'}</span>
                    <span className="text-xs text-slate-400">({(product as any).reviewCount || '0'})</span>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-900">${Number(product.price).toFixed(2)}</p>
                      {Number(product.price) > 50 && (
                        <p className="text-[10px] uppercase font-bold text-emerald-600 mt-0.5 tracking-wider">Free Shipping</p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Categories Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Electronics & Gadgets</h3>
          <p className="text-blue-700 mb-4 opacity-80">Up to 40% off direct from global suppliers</p>
          <button className="text-blue-700 font-bold hover:underline">Shop now →</button>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-rose-900 mb-2">Fashion & Apparel</h3>
          <p className="text-rose-700 mb-4 opacity-80">New summer collections from independent boutiques</p>
          <button className="text-rose-700 font-bold hover:underline">Shop now →</button>
        </div>
      </div>
    </div>
  );
}

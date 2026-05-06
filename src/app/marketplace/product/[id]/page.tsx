import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, Store, ShieldCheck, Truck } from 'lucide-react';
import { AddToCartButton } from '@/components/marketplace/AddToCartButton';
import prisma from '@/lib/prisma';
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { name: true, description: true, organization: { select: { name: true } } }
  });

  if (!product) return { title: 'Product Not Found' };

  const description = product.description?.substring(0, 160) || `Buy ${product.name} from ${product.organization.name} on the SmartStore Marketplace.`;

  return {
    title: `${product.name} | ${product.organization.name} | SmartStore`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
    }
  };
}

export const dynamic = 'force-dynamic';

export default async function GlobalProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { 
      id: params.id,
      isMarketplacePublished: true 
    },
    include: {
      organization: true,
      category: true,
    }
  });

  if (!product) {
    return notFound();
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-slate-500 mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/marketplace" className="hover:text-indigo-600 transition-colors">Marketplace</Link>
          </li>
          {product.category && (
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-slate-300">/</span>
                <span className="hover:text-indigo-600 transition-colors cursor-pointer">{product.category.name}</span>
              </div>
            </li>
          )}
          <li aria-current="page">
            <div className="flex items-center">
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-slate-900 font-medium truncate max-wxs">{product.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gallery */}
        <div className="lg:col-span-5 aspect-square bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden relative">
          <span className="text-slate-400">Main Image Placeholder</span>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <h1 className="text-3xl font-black text-slate-900 leading-tight">{product.name}</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-900">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-indigo-600 hover:underline cursor-pointer">{product.reviewCount} Reviews</span>
          </div>

          <div className="pb-6 border-b border-slate-200">
            <p className="text-4xl font-black text-slate-900 tracking-tight">${Number(product.price).toFixed(2)}</p>
            {product.stock > 0 ? (
              <p className="text-sm font-bold text-emerald-600 tracking-wide mt-2">IN STOCK ({product.stock} available)</p>
            ) : (
              <p className="text-sm font-bold text-rose-600 tracking-wide mt-2">OUT OF STOCK</p>
            )}
          </div>

          <div className="prose prose-sm text-slate-600">
            <p>{product.description || 'No description provided by the merchant.'}</p>
          </div>
        </div>

        {/* Action Box & Merchant Info */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 sticky top-24">
            
            {/* Merchant Info */}
            <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {product.organization.logo ? (
                  <Image src={product.organization.logo} alt={product.organization.name} width={48} height={48} className="object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Sold By</p>
                <p className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer">{product.organization.name}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" /> Verified Merchant
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Ships within 2-3 business days</span>
              </div>
            </div>

            <AddToCartButton 
              product={{
                id: product.id,
                name: product.name,
                price: Number(product.price),
                organizationId: product.organizationId,
                organizationName: product.organization.name,
                stock: product.stock,
                logo: product.organization.logo || undefined
              }} 
            />
            <p className="text-xs text-center text-slate-500 mt-4">Protected by SmartStore Buyer Guarantee</p>
          </div>
        </div>

      </div>
    </div>
  );
}

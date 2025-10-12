'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingCart, User, Heart, Package, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/portal/shop" className="text-2xl font-bold text-primary">
              SmartStore
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/portal/shop" className="text-gray-600 hover:text-primary">Shop</Link>
              <Link href="/portal/my-orders" className="text-gray-600 hover:text-primary">My Orders</Link>
              <Link href="/portal/wishlist" className="text-gray-600 hover:text-primary">Wishlist</Link>
              <Link href="/portal/my-profile" className="text-gray-600 hover:text-primary">Profile</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/portal/cart" className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
              <Link href="/portal/my-profile">
                <User className="w-6 h-6 text-gray-600" />
              </Link>
              <button onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 SmartStore. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}


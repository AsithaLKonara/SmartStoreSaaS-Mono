import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merchant Storefront | Powered by SmartStore',
  description: 'A premium, high-performance shopping experience powered by the SmartStore Commerce OS.',
};

import { StorefrontCartProvider } from '@/hooks/useStorefrontCart';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontCartProvider>
      {children}
    </StorefrontCartProvider>
  );
}

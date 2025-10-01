'use client';

import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
}

function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

export default MobileLayout;


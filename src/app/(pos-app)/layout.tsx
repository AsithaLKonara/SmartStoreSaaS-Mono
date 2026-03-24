import React from 'react';

export const metadata = {
  title: 'POS Terminal',
  description: 'Point of Sale Terminal',
};

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col font-sans select-none touch-manipulation">
      {/* 
        This layout isolates the POS from the rest of the application.
        No dashboard sidebars, headers, etc. It is purely full screen.
        Touch-manipulation prevents double-tap zoom on touch devices.
        select-none prevents accidental text selection while tapping fast.
      */}
      {children}
    </div>
  );
}

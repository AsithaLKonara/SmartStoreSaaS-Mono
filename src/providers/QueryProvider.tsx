'use client';

/**
 * React Query Provider
 * Wraps the app with QueryClientProvider for data fetching and caching
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client that persists across renders
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools removed - install @tanstack/react-query-devtools to enable */}
    </QueryClientProvider>
  );
}


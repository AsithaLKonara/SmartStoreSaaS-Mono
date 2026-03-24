import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { IDBQueue } from '@/lib/pos/idb-queue';
import { POSSyncWorker } from '@/lib/pos/sync-worker';
import { toast } from 'react-hot-toast';

interface POSState {
  currentCustomer: any | null;
  setCurrentCustomer: (customer: any) => void;
  terminalId: string | null;
  setTerminalId: (id: string) => void;
  shiftUserId: string | null;
  setShiftUserId: (id: string) => void;
  offlineMode: boolean;
  setOfflineMode: (enabled: boolean) => void;
  processOfflineSale: (payload: any) => Promise<void>;
  pendingSyncCount: number;
}

const POSContext = createContext<POSState | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [currentCustomer, setCurrentCustomer] = useState<any | null>(null);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [shiftUserId, setShiftUserId] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Initialize background sync worker
  useEffect(() => {
    POSSyncWorker.start(30000); // Check every 30 seconds
    
    const countCheck = setInterval(async () => {
      const all = await IDBQueue.getAll().catch(() => []);
      setPendingSyncCount(all.length);
    }, 5000);

    return () => {
      POSSyncWorker.stop();
      clearInterval(countCheck);
    };
  }, []);

  const processOfflineSale = async (payload: any) => {
    try {
      await IDBQueue.enqueue(payload);
      const all = await IDBQueue.getAll();
      setPendingSyncCount(all.length);
      toast.success('Sale recorded offline. Will sync when online.');
    } catch (error) {
      toast.error('Failed to save offline sale!');
      throw error;
    }
  };

  return (
    <POSContext.Provider
      value={{
        currentCustomer,
        setCurrentCustomer,
        terminalId,
        setTerminalId,
        shiftUserId,
        setShiftUserId,
        offlineMode,
        setOfflineMode,
        processOfflineSale,
        pendingSyncCount
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}

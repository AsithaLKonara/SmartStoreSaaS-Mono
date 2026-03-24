import { IDBQueue, OfflineTransaction } from './idb-queue';
import { logger } from '@/lib/logger';
import axios from 'axios';

/**
 * Singleton sync worker to drain the IndexedDB POS queue.
 * Automatically handles retry logic and background synchronization.
 */
export class POSSyncWorker {
  private static isSyncing = false;
  private static intervalId: any = null;

  static start(intervalMs = 30000) {
    if (this.intervalId) return;
    
    // Attempt sync immediately on start
    this.sync();
    
    this.intervalId = setInterval(() => {
      this.sync();
    }, intervalMs);
    
    logger.info({ message: 'POS Sync Worker started', context: { intervalMs } });
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  static async sync() {
    if (this.isSyncing) return;
    
    const queue = await IDBQueue.getAll();
    if (queue.length === 0) return;

    this.isSyncing = true;
    logger.info({ message: `POS Sync Worker: Attempting to sync ${queue.length} transactions.` });

    for (const transaction of queue) {
      try {
        await this.syncTransaction(transaction);
        await IDBQueue.remove(transaction.id);
        logger.info({ message: `POS Sync Worker: Successfully synced transaction ${transaction.id}` });
      } catch (error) {
        await IDBQueue.updateStatus(transaction.id, 'FAILED');
        logger.error({ 
          message: `POS Sync Worker: Failed to sync transaction ${transaction.id}`, 
          error 
        });
        // Stop syncing the rest of the queue if we hit a network error
        break; 
      }
    }

    this.isSyncing = false;
  }

  private static async syncTransaction(transaction: OfflineTransaction) {
    // We call the standard POS checkout API
    const response = await axios.post('/api/pos/checkout', {
      ...transaction.payload,
      isOfflineSync: true,
      offlineTimestamp: transaction.timestamp
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Server rejected offline transaction');
    }
  }
}

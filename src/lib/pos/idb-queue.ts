/**
 * Native IndexedDB wrapper for durable POS offline queueing.
 * Replaces unreliable LocalStorage for high-volume commerce data.
 */

const DB_NAME = 'SmartStore_POS_Offline';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

export interface OfflineTransaction {
  id: string; // Internal UUID
  timestamp: number;
  payload: any; // The checkout data
  attempts: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

export class IDBQueue {
  private static db: IDBDatabase | null = null;

  private static async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  static async enqueue(payload: any): Promise<string> {
    const db = await this.getDB();
    const id = crypto.randomUUID();
    const transaction: OfflineTransaction = {
      id,
      timestamp: Date.now(),
      payload,
      attempts: 0,
      status: 'PENDING'
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(transaction);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAll(): Promise<OfflineTransaction[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async remove(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async updateStatus(id: string, status: OfflineTransaction['status']): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.status = status;
          if (status === 'FAILED') data.attempts += 1;
          store.put(data);
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

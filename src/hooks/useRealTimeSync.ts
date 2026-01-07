'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncEvent } from '@/lib/sync/realTimeSyncService';
import { logger } from '@/lib/logger';

interface SyncStatus {
  lastSync: Date | null;
  pendingEvents: number;
  activeConnections: number;
  isOnline: boolean;
}

interface UseRealTimeSyncOptions {
  organizationId: string;
  autoConnect?: boolean;
  onEvent?: (event: SyncEvent) => void;
  onStatusChange?: (status: SyncStatus) => void;
  onError?: (error: Error) => void;
}

export function useRealTimeSync({
  organizationId,
  autoConnect = true,
  onEvent,
  onStatusChange,
  onError
}: UseRealTimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    pendingEvents: 0,
    activeConnections: 0,
    isOnline: false
  });
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [conflicts, setConflicts] = useState<unknown[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(`ws://localhost:3001?organizationId=${organizationId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        logger.info({
          message: 'Real-time sync connected',
          context: { organizationId }
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'initial_state') {
            setSyncStatus(prev => ({
              ...prev,
              lastSync: data.lastSync ? new Date(data.lastSync) : null,
              pendingEvents: data.pendingEvents,
              isOnline: true
            }));
          } else if (data.type === 'sync_event') {
            const syncEvent = data.event as SyncEvent;
            setEvents(prev => [syncEvent, ...prev.slice(0, 99)]); // Keep last 100 events
            onEvent?.(syncEvent);
          } else if (data.type === 'conflict') {
            setConflicts(prev => [data.conflict, ...prev.slice(0, 49)]); // Keep last 50 conflicts
          }
        } catch (error) {
          logger.error({
            message: 'Error parsing sync message',
            error: error instanceof Error ? error : new Error(String(error)),
            context: { organizationId }
          });
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSyncStatus(prev => ({ ...prev, isOnline: false }));
        logger.info({
          message: 'Real-time sync disconnected',
          context: { organizationId, reconnectAttempts: reconnectAttemptsRef.current }
        });
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, Math.pow(2, reconnectAttemptsRef.current) * 1000); // Exponential backoff
        }
      };

      ws.onerror = (error) => {
        logger.error({
          message: 'WebSocket error',
          error: error instanceof Error ? error : new Error('WebSocket connection failed'),
          context: { organizationId }
        });
        onError?.(new Error('WebSocket connection failed'));
      };

    } catch (error) {
      logger.error({
        message: 'Error creating WebSocket connection',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId }
      });
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [organizationId, onEvent, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setSyncStatus(prev => ({ ...prev, isOnline: false }));
  }, []);

  const sendEvent = useCallback((event: Omit<SyncEvent, 'id' | 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const syncEvent: SyncEvent = {
        ...event,
        id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      
      wsRef.current.send(JSON.stringify(syncEvent));
      return true;
    }
    return false;
  }, []);

  const getSyncStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/sync/status?organizationId=${organizationId}`);
      if (response.ok) {
        const status = await response.json();
        setSyncStatus(status);
        onStatusChange?.(status);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching sync status',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId }
      });
    }
  }, [organizationId, onStatusChange]);

  const forceSync = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'force_sync',
          organizationId
        })
      });
      
      if (response.ok) {
        await getSyncStatus();
        return true;
      }
    } catch (error) {
      logger.error({
        message: 'Error forcing sync',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId }
      });
    }
    return false;
  }, [organizationId, getSyncStatus]);

  const resolveConflict = useCallback(async (conflictId: string, resolution: unknown) => {
    try {
      const response = await fetch('/api/sync/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_conflict',
          conflictId,
          resolution,
          organizationId
        })
      });
      
      if (response.ok) {
        setConflicts(prev => prev.filter(c => (c as any).id !== conflictId));
        return true;
      }
    } catch (error) {
      logger.error({
        message: 'Error resolving conflict',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId, conflictId }
      });
    }
    return false;
  }, [organizationId]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && organizationId) {
      connect();
      getSyncStatus();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, organizationId, connect, disconnect, getSyncStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected,
    syncStatus,
    events,
    conflicts,
    
    // Actions
    connect,
    disconnect,
    sendEvent,
    getSyncStatus,
    forceSync,
    resolveConflict,
    
    // Utilities
    reconnectAttempts: reconnectAttemptsRef.current
  };
} 
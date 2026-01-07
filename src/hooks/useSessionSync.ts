/**
 * Multi-Tab Session Sync Hook
 * Keeps session state synchronized across browser tabs
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const SESSION_STORAGE_KEY = 'smartstore-session-state';
const SESSION_CHANGE_EVENT = 'session-changed';

interface SessionState {
  isAuthenticated: boolean;
  userId?: string;
  timestamp: number;
}

/**
 * Hook to sync session across browser tabs
 */
export function useSessionSync() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const routerRef = useRef(router);
  const sessionRef = useRef(session);

  // Keep refs updated
  useEffect(() => {
    routerRef.current = router;
    sessionRef.current = session;
  }, [router, session]);

  useEffect(() => {
    // Update session state in localStorage when it changes
    if (status !== 'loading') {
      const state: SessionState = {
        isAuthenticated: !!session,
        userId: (session?.user as any)?.id,
        timestamp: Date.now(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));

      // Broadcast change to other tabs
      window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
    }
  }, [session, status]);

  useEffect(() => {
    // Listen for session changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) {
        const newState: SessionState | null = e.newValue
          ? JSON.parse(e.newValue)
          : null;
        const currentState: SessionState | null = e.oldValue
          ? JSON.parse(e.oldValue)
          : null;

        // If session state changed significantly
        if (
          newState?.isAuthenticated !== currentState?.isAuthenticated ||
          newState?.userId !== currentState?.userId
        ) {
          logger.info({
            message: 'Session changed in another tab, syncing',
            context: { 
              wasAuthenticated: currentState?.isAuthenticated,
              isAuthenticated: newState?.isAuthenticated,
              userId: newState?.userId
            }
          });

          // If logged out in another tab, refresh to update UI
          if (!newState?.isAuthenticated && currentState?.isAuthenticated) {
            logger.info({
              message: 'Logged out in another tab, redirecting',
              context: { userId: currentState?.userId }
            });
            routerRef.current.push('/login');
            routerRef.current.refresh();
          }

          // If logged in in another tab, refresh to update UI
          if (newState?.isAuthenticated && !currentState?.isAuthenticated) {
            logger.info({
              message: 'Logged in in another tab, refreshing',
              context: { userId: newState?.userId }
            });
            routerRef.current.refresh();
          }
        }
      }
    };

    // Listen for custom session change events
    const handleSessionChange = () => {
      // Small delay to allow localStorage to update
      setTimeout(() => {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const state: SessionState = JSON.parse(stored);
          const currentUserId = (sessionRef.current?.user as any)?.id;

          // If user changed, refresh
          if (state.userId !== currentUserId) {
            logger.info({
              message: 'User changed, refreshing',
              context: { 
                previousUserId: currentUserId,
                newUserId: state.userId
              }
            });
            routerRef.current.refresh();
          }
        }
      }, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    };
  }, []); // Empty deps - using refs for router and session

  useEffect(() => {
    // Heartbeat to detect tab closure
    const heartbeatInterval = setInterval(() => {
      if (session) {
        const state: SessionState = {
          isAuthenticated: true,
          userId: (session.user as any)?.id,
          timestamp: Date.now(),
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [session]);
}

/**
 * Get current session state from storage
 */
export function getStoredSessionState(): SessionState | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Clear stored session state
 */
export function clearStoredSessionState() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

/**
 * Broadcast session change to all tabs
 */
export function broadcastSessionChange() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}




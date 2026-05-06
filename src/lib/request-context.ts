let requestContextStore: any = null;

if (typeof window === 'undefined') {
  try {
    const { AsyncLocalStorage } = require('async_hooks');
    requestContextStore = new AsyncLocalStorage();
  } catch (e) {
    // Fallback for non-node environments
  }
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  organizationId?: string;
  role?: string;
}

export { requestContextStore };

/**
 * Helper to retrieve current active request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStore ? requestContextStore.getStore() : undefined;
}

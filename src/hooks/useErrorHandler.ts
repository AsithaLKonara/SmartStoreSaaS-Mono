import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    logger.error({
      message: `Error${context ? ` in ${context}` : ''}`,
      error: error instanceof Error ? error : new Error(String(error)),
      context: { hook: 'useErrorHandler', operation: 'handleError', errorContext: context }
    });
    
    let message = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    toast.error(message);
  }, []);

  return { handleError };
}


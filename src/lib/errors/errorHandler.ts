/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error Codes
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Business Logic
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ORDER_PROCESSING_FAILED: 'ORDER_PROCESSING_FAILED',
  
  // External Services
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  SMS_SEND_FAILED: 'SMS_SEND_FAILED',
  
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Convert any error to AppError
 */
export const handleAPIError = (error: unknown, defaultMessage = 'An error occurred'): AppError => {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message || defaultMessage,
      ErrorCodes.UNKNOWN_ERROR
    );
  }

  // Fetch/Network Error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new AppError(
      (error as any).message || defaultMessage,
      ErrorCodes.NETWORK_ERROR
    );
  }

  // String error
  if (typeof error === 'string') {
    return new AppError(error, ErrorCodes.UNKNOWN_ERROR);
  }

  // Unknown error type
  return new AppError(defaultMessage, ErrorCodes.UNKNOWN_ERROR);
};

/**
 * Log error with context
 */
export const logError = (
  error: Error | AppError,
  context?: Record<string, any>,
  correlationId?: string
): void => {
  logger.error({
    message: error.message,
    error: error.name,
    stack: error.stack,
    context: {
      ...context,
      ...(error instanceof AppError ? error.context : {}),
      code: error instanceof AppError ? error.code : undefined,
      statusCode: error instanceof AppError ? error.statusCode : undefined,
    },
    correlation: correlationId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle error and show user notification
 */
export const handleErrorWithToast = (
  error: unknown,
  context?: Record<string, any>,
  customMessage?: string
): AppError => {
  const appError = handleAPIError(error, customMessage);
  
  // Log error for debugging
  logError(appError, context);
  
  // Show user-friendly toast
  toast.error(getUserFriendlyMessage(appError));
  
  return appError;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: AppError | Error): string => {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.UNAUTHORIZED:
        return 'You are not authorized to perform this action. Please log in.';
      case ErrorCodes.FORBIDDEN:
        return 'You do not have permission to access this resource.';
      case ErrorCodes.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please try again.';
      case ErrorCodes.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ErrorCodes.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';
      case ErrorCodes.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorCodes.DUPLICATE_ENTRY:
        return 'This item already exists. Please use a different value.';
      case ErrorCodes.INSUFFICIENT_STOCK:
        return 'Insufficient stock available for this operation.';
      case ErrorCodes.PAYMENT_FAILED:
        return 'Payment processing failed. Please try again.';
      case ErrorCodes.EXTERNAL_API_ERROR:
        return 'External service is currently unavailable. Please try again later.';
      case ErrorCodes.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case ErrorCodes.TIMEOUT:
        return 'Request timeout. Please try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Create error from API response
 */
export const createErrorFromResponse = async (response: Response): Promise<AppError> => {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  const code = errorData.code || getErrorCodeFromStatus(response.status);
  const message = errorData.message || errorData.error || `HTTP Error ${response.status}`;

  return new AppError(message, code, response.status, errorData.details);
};

/**
 * Get error code from HTTP status
 */
const getErrorCodeFromStatus = (status: number): string => {
  switch (status) {
    case 400: return ErrorCodes.VALIDATION_ERROR;
    case 401: return ErrorCodes.UNAUTHORIZED;
    case 403: return ErrorCodes.FORBIDDEN;
    case 404: return ErrorCodes.NOT_FOUND;
    case 408: return ErrorCodes.TIMEOUT;
    case 409: return ErrorCodes.DUPLICATE_ENTRY;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorCodes.EXTERNAL_API_ERROR;
    default: return ErrorCodes.UNKNOWN_ERROR;
  }
};

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        logger.warn({
          message: `Retrying after error (attempt ${i + 1}/${maxRetries})`,
          error: lastError.message,
          delay,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Handle async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return handleErrorWithToast(error, context, errorMessage) as never;
  }
}


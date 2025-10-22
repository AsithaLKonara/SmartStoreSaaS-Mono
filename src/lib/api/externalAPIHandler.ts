/**
 * External API Handler
 * Robust utility for calling external APIs with timeout, retry, and error handling
 */

import { logger } from '@/lib/logger';

export interface ExternalAPIOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ExternalAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

/**
 * Call external API with timeout, retry, and comprehensive error handling
 */
export async function callExternalAPI<T = any>(
  url: string,
  options: ExternalAPIOptions = {}
): Promise<T> {
  const {
    timeout = 10000, // 10 seconds default
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check response status
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          let errorData: any;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          throw new ExternalAPIError(
            errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
          );
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as T;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof ExternalAPIError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        break;
      }

      // Don't retry on abort (timeout)
      if (error.name === 'AbortError') {
        throw new ExternalAPIError('Request timeout', 408);
      }

      // Retry on network errors or 5xx errors
      if (attempt < retries) {
        logger.warn({
          message: `External API call failed, retrying (${attempt + 1}/${retries})`,
          url,
          error: error.message,
        });
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  // All retries failed
  logger.error({
    message: 'External API call failed after retries',
    url,
    error: lastError?.message,
  });

  throw lastError || new ExternalAPIError('External API call failed');
}

/**
 * Validate external API URL
 */
export function isValidExternalURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate webhook signature (generic)
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  } catch (error) {
    logger.error({
      message: 'Webhook signature validation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}


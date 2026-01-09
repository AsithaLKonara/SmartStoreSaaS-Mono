/**
 * Request Helpers for API Testing
 * 
 * Provides utilities for making HTTP requests with proper authentication and correlation IDs
 */

import { TestUser, createTestHeaders } from './auth-helpers';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  user?: TestUser;
  correlationId?: string;
}

/**
 * Create a fetch request with authentication and correlation ID
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body,
    user,
    correlationId
  } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Add authentication if user provided
  if (user) {
    Object.assign(requestHeaders, createTestHeaders(user, correlationId));
  } else if (correlationId) {
    requestHeaders['X-Request-Id'] = correlationId;
    requestHeaders['X-Correlation-ID'] = correlationId;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

/**
 * Make GET request
 */
export async function get(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<Response> {
  return makeAuthenticatedRequest(url, { ...options, method: 'GET' });
}

/**
 * Make POST request
 */
export async function post(url: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<Response> {
  return makeAuthenticatedRequest(url, { ...options, method: 'POST', body });
}

/**
 * Make PUT request
 */
export async function put(url: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<Response> {
  return makeAuthenticatedRequest(url, { ...options, method: 'PUT', body });
}

/**
 * Make DELETE request
 */
export async function del(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<Response> {
  return makeAuthenticatedRequest(url, { ...options, method: 'DELETE' });
}

/**
 * Parse JSON response
 */
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }
}

/**
 * Assert response is successful
 */
export function assertSuccess(response: Response, statusCode: number = 200): void {
  if (response.status !== statusCode) {
    throw new Error(`Expected status ${statusCode}, got ${response.status}`);
  }
}

/**
 * Assert response is an error
 */
export function assertError(response: Response, expectedCode?: string): void {
  if (response.status < 400) {
    throw new Error(`Expected error status, got ${response.status}`);
  }
}

/**
 * Assert response has correlation ID
 */
export function assertCorrelationId(response: Response): void {
  const correlationId = response.headers.get('X-Request-Id') || response.headers.get('X-Correlation-ID');
  if (!correlationId) {
    throw new Error('Response missing correlation ID');
  }
}

/**
 * Extract correlation ID from response
 */
export function getCorrelationId(response: Response): string | null {
  return response.headers.get('X-Request-Id') || response.headers.get('X-Correlation-ID');
}

/**
 * Wait for async operation (useful for testing eventual consistency)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a request with exponential backoff
 */
export async function retryRequest(
  requestFn: () => Promise<Response>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await requestFn();
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    
    if (i < maxRetries - 1) {
      await wait(delay * Math.pow(2, i));
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

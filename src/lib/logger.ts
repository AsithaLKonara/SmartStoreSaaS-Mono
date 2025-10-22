/**
 * Structured Logger
 * 
 * Centralized logging service with:
 * - Structured JSON logging
 * - Log levels (debug, info, warn, error)
 * - Correlation ID support
 * - Context enrichment
 * - Production-safe (no sensitive data)
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   
 *   logger.info({ message: 'User logged in', userId: '123' });
 *   logger.error({ message: 'Payment failed', error: err, correlation: 'uuid' });
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlation?: string;
  context?: Record<string, any>;
  error?: any;
  stack?: string;
}

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /ssn/i,
  /credit[_-]?card/i,
  /cvv/i
];

/**
 * Check if a key should be redacted
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(obj: any, depth = 0): any {
  if (depth > 5) return '[Max Depth]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Format error for logging
 */
function formatError(error: any): Record<string, any> {
  if (!error) return {};

  return {
    name: error.name || 'Error',
    message: error.message || String(error),
    code: error.code,
    statusCode: error.statusCode,
    ...(process.env.NODE_ENV !== 'production' && error.stack
      ? { stack: error.stack.split('\n').slice(0, 10).join('\n') }
      : {})
  };
}

/**
 * Core logging function
 */
function log(level: LogLevel, data: Omit<LogEntry, 'level' | 'timestamp'>): void {
  const entry: LogEntry = {
    level,
    message: data.message,
    timestamp: new Date().toISOString(),
    ...(data.correlation && { correlation: data.correlation }),
    ...(data.context && { context: redactSensitiveData(data.context) }),
    ...(data.error && { error: formatError(data.error) })
  };

  // In production, send to logging service (e.g., CloudWatch, Datadog)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to production logging service
    console.log(JSON.stringify(entry));
  } else {
    // Development: pretty print with colors
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m'  // Red
    };
    const reset = '\x1b[0m';
    const color = colors[level];

    console.log(
      `${color}[${level.toUpperCase()}]${reset} ${entry.timestamp} ${entry.message}`,
      entry.correlation ? `[${entry.correlation}]` : '',
      '\n',
      JSON.stringify(
        { context: entry.context, error: entry.error },
        null,
        2
      )
    );
  }
}

/**
 * Logger interface
 */
export const logger = {
  debug: (data: Omit<LogEntry, 'level' | 'timestamp'>) => {
    if (process.env.NODE_ENV !== 'production') {
      log(LogLevel.DEBUG, data);
    }
  },

  info: (data: Omit<LogEntry, 'level' | 'timestamp'>) => {
    log(LogLevel.INFO, data);
  },

  warn: (data: Omit<LogEntry, 'level' | 'timestamp'>) => {
    log(LogLevel.WARN, data);
  },

  error: (data: Omit<LogEntry, 'level' | 'timestamp'>) => {
    log(LogLevel.ERROR, data);
  }
};

/**
 * Example usage:
 * 
 * // Basic logging
 * logger.info({ message: 'Server started', context: { port: 3000 } });
 * 
 * // With correlation ID
 * logger.error({
 *   message: 'Database query failed',
 *   error: err,
 *   correlation: req.correlationId,
 *   context: { query: 'SELECT * FROM users' }
 * });
 * 
 * // Sensitive data is automatically redacted
 * logger.info({
 *   message: 'User logged in',
 *   context: {
 *     userId: '123',
 *     password: 'secret123' // Will be logged as [REDACTED]
 *   }
 * });
 */


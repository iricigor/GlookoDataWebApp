/**
 * Centralized Logger Utility for GlookoDataWebApp
 * 
 * This module provides structured logging with:
 * - Log levels (debug, info, warn, error)
 * - Correlation IDs for tracking requests
 * - Structured context data
 * - Console output with formatted messages
 * 
 * Usage:
 * ```ts
 * import { logger, generateCorrelationId } from './logger';
 * 
 * // Generate a correlation ID for a request
 * const correlationId = generateCorrelationId();
 * 
 * // Log with context
 * logger.info('API call started', { correlationId, endpoint: '/api/user/settings' });
 * logger.error('API call failed', { correlationId, error: err.message, statusCode: 500 });
 * ```
 */

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Context data that can be passed with log messages
 */
export interface LogContext {
  /** Unique identifier to correlate related log entries */
  correlationId?: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** API endpoint being called */
  endpoint?: string;
  /** Duration of operation in milliseconds */
  durationMs?: number;
  /** Error message or stack trace */
  error?: string;
  /** Error type classification */
  errorType?: string;
  /** User identifier (anonymized) */
  userId?: string;
  /** Component or module name */
  component?: string;
  /** Any additional context data */
  [key: string]: unknown;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level to output. Default is 'info' in production, 'debug' in development */
  minLevel?: LogLevel;
  /** Whether to include timestamps in console output. Default is true */
  includeTimestamp?: boolean;
  /** Application name prefix for log messages. Default is 'GlookoUI' */
  appName?: string;
}

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Generate a unique correlation ID for tracking related operations
 * Format: 8 character hex string with timestamp component
 * 
 * @returns Unique correlation ID string
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(16).slice(-4);
  const random = Math.random().toString(16).slice(2, 6);
  return `${timestamp}${random}`;
}

/**
 * Create a logger instance with the specified configuration
 * 
 * @param config - Logger configuration options
 * @returns Logger object with log methods
 */
export function createLogger(config: LoggerConfig = {}) {
  const isDevelopment = import.meta.env?.DEV === true;
  const defaultMinLevel: LogLevel = isDevelopment ? 'debug' : 'info';
  
  const {
    minLevel = defaultMinLevel,
    includeTimestamp = true,
    appName = 'GlookoUI',
  } = config;

  /**
   * Check if a log level should be output based on minimum level
   */
  function shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
  }

  /**
   * Format a log entry for console output
   */
  function formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }
    
    parts.push(`[${appName}]`);
    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(entry.message);
    
    return parts.join(' ');
  }

  /**
   * Format context object for console output
   */
  function formatContext(context?: LogContext): object | undefined {
    if (!context || Object.keys(context).length === 0) {
      return undefined;
    }
    return context;
  }

  /**
   * Core logging function
   */
  function log(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    const formattedMessage = formatLogEntry(entry);
    const formattedContext = formatContext(context);

    // Output to console with appropriate method
    switch (level) {
      case 'debug':
        if (formattedContext) {
          console.debug(formattedMessage, formattedContext);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        if (formattedContext) {
          console.info(formattedMessage, formattedContext);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (formattedContext) {
          console.warn(formattedMessage, formattedContext);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (formattedContext) {
          console.error(formattedMessage, formattedContext);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  }

  return {
    /**
     * Log a debug message (only shown in development by default)
     */
    debug: (message: string, context?: LogContext) => log('debug', message, context),

    /**
     * Log an informational message
     */
    info: (message: string, context?: LogContext) => log('info', message, context),

    /**
     * Log a warning message
     */
    warn: (message: string, context?: LogContext) => log('warn', message, context),

    /**
     * Log an error message
     */
    error: (message: string, context?: LogContext) => log('error', message, context),

    /**
     * Create a child logger with preset context
     */
    withContext: (defaultContext: LogContext) => {
      return {
        debug: (message: string, context?: LogContext) => 
          log('debug', message, { ...defaultContext, ...context }),
        info: (message: string, context?: LogContext) => 
          log('info', message, { ...defaultContext, ...context }),
        warn: (message: string, context?: LogContext) => 
          log('warn', message, { ...defaultContext, ...context }),
        error: (message: string, context?: LogContext) => 
          log('error', message, { ...defaultContext, ...context }),
      };
    },
  };
}

/**
 * Default logger instance for the application
 */
export const logger = createLogger();

/**
 * Create a logger for API client operations with automatic correlation
 * 
 * @param endpoint - The API endpoint being called
 * @returns Object with start, success, and error logging methods
 */
export function createApiLogger(endpoint: string) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  
  return {
    correlationId,
    
    /**
     * Log the start of an API request
     */
    logStart: (method: string, additionalContext?: LogContext) => {
      logger.info(`API ${method} request started`, {
        correlationId,
        endpoint,
        component: 'ApiClient',
        ...additionalContext,
      });
    },
    
    /**
     * Log successful completion of an API request
     */
    logSuccess: (statusCode?: number, additionalContext?: LogContext) => {
      const durationMs = Date.now() - startTime;
      logger.info(`API request completed successfully`, {
        correlationId,
        endpoint,
        statusCode,
        durationMs,
        component: 'ApiClient',
        ...additionalContext,
      });
    },
    
    /**
     * Log an API request error
     */
    logError: (error: string, errorType?: string, statusCode?: number, additionalContext?: LogContext) => {
      const durationMs = Date.now() - startTime;
      logger.error(`API request failed`, {
        correlationId,
        endpoint,
        error,
        errorType,
        statusCode,
        durationMs,
        component: 'ApiClient',
        ...additionalContext,
      });
    },
  };
}

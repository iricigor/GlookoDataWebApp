/**
 * Centralized Logger Utility for GlookoDataWebApp Azure Functions API
 * 
 * This module provides structured logging with:
 * - Log levels (debug, info, warn, error)
 * - Correlation IDs for tracking requests
 * - Request/response timing
 * - Structured context data
 * - Integration with Azure Functions InvocationContext
 * 
 * Usage:
 * ```ts
 * import { createRequestLogger, generateCorrelationId } from '../utils/logger';
 * 
 * async function handler(request: HttpRequest, context: InvocationContext) {
 *   const requestLogger = createRequestLogger(request, context);
 *   requestLogger.logStart();
 *   
 *   try {
 *     // ... process request
 *     return requestLogger.logSuccess({ status: 200, jsonBody: { data } });
 *   } catch (error) {
 *     return requestLogger.logError(error, 500);
 *   }
 * }
 * ```
 */

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { randomUUID } from "crypto";

/**
 * Context data for log entries
 */
export interface LogContext {
  /** Unique identifier to correlate related log entries */
  correlationId?: string;
  /** HTTP method of the request */
  method?: string;
  /** Request URL path */
  path?: string;
  /** HTTP status code of the response */
  statusCode?: number;
  /** Duration of operation in milliseconds */
  durationMs?: number;
  /** Error message */
  error?: string;
  /** Error type classification */
  errorType?: string;
  /** User identifier (anonymized) */
  userId?: string;
  /** Function name */
  functionName?: string;
  /** Any additional context data */
  [key: string]: unknown;
}

/**
 * Generate a unique correlation ID for tracking related operations
 * Uses crypto.randomUUID() for reliable unique ID generation.
 * 
 * @returns Unique correlation ID string (8 characters)
 */
export function generateCorrelationId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

/**
 * Extract correlation ID from request headers or generate a new one
 * 
 * @param request - HTTP request object
 * @returns Correlation ID string
 */
export function getOrCreateCorrelationId(request: HttpRequest): string {
  // Check for correlation ID in common header names
  const headerNames = ['x-correlation-id', 'x-request-id', 'correlation-id', 'request-id'];
  
  for (const headerName of headerNames) {
    const value = request.headers.get(headerName);
    if (value) {
      return value;
    }
  }
  
  return generateCorrelationId();
}

/**
 * Format log context for structured logging
 * Filters out undefined values for cleaner output
 */
function formatContext(context: LogContext): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Create a logger for handling HTTP requests in Azure Functions
 * Provides automatic request/response logging with correlation IDs
 * 
 * @param request - HTTP request object
 * @param invocationContext - Azure Functions invocation context
 * @returns Request logger object with logging methods
 */
export function createRequestLogger(request: HttpRequest, invocationContext: InvocationContext) {
  const correlationId = getOrCreateCorrelationId(request);
  const startTime = Date.now();
  const method = request.method;
  const path = new URL(request.url).pathname;
  const functionName = invocationContext.functionName;
  
  const baseContext: LogContext = {
    correlationId,
    method,
    path,
    functionName,
  };

  return {
    /** Correlation ID for this request */
    correlationId,

    /**
     * Log the start of request processing
     */
    logStart: (additionalContext?: LogContext) => {
      invocationContext.log(
        `[${correlationId}] ${method} ${path} - Request started`,
        formatContext({ ...baseContext, ...additionalContext })
      );
    },

    /**
     * Log successful completion of request
     * Returns the response with correlation ID header added
     */
    logSuccess: (response: HttpResponseInit, additionalContext?: LogContext): HttpResponseInit => {
      const durationMs = Date.now() - startTime;
      const statusCode = response.status || 200;
      
      invocationContext.log(
        `[${correlationId}] ${method} ${path} - Request completed successfully (${statusCode}) in ${durationMs}ms`,
        formatContext({ ...baseContext, statusCode, durationMs, ...additionalContext })
      );
      
      // Add correlation ID to response headers
      return {
        ...response,
        headers: {
          ...response.headers,
          'x-correlation-id': correlationId,
        },
      };
    },

    /**
     * Log an error during request processing
     * Returns an error response with correlation ID header added
     */
    logError: (
      error: unknown, 
      statusCode: number = 500, 
      errorType?: string,
      additionalContext?: LogContext
    ): HttpResponseInit => {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      invocationContext.error(
        `[${correlationId}] ${method} ${path} - Request failed (${statusCode}) in ${durationMs}ms: ${errorMessage}`,
        formatContext({ 
          ...baseContext, 
          statusCode, 
          durationMs, 
          error: errorMessage,
          errorType,
          errorStack,
          ...additionalContext 
        })
      );
      
      return {
        status: statusCode,
        jsonBody: {
          error: errorMessage,
          errorType: errorType || 'unknown',
          correlationId,
        },
        headers: {
          'x-correlation-id': correlationId,
        },
      };
    },

    /**
     * Log a warning message during request processing
     */
    logWarn: (message: string, additionalContext?: LogContext) => {
      invocationContext.warn(
        `[${correlationId}] ${method} ${path} - ${message}`,
        formatContext({ ...baseContext, ...additionalContext })
      );
    },

    /**
     * Log a debug/info message during request processing
     */
    logInfo: (message: string, additionalContext?: LogContext) => {
      invocationContext.log(
        `[${correlationId}] ${method} ${path} - ${message}`,
        formatContext({ ...baseContext, ...additionalContext })
      );
    },

    /**
     * Log authentication-related events
     */
    logAuth: (success: boolean, userId?: string, reason?: string) => {
      if (success) {
        invocationContext.log(
          `[${correlationId}] ${method} ${path} - Authentication successful`,
          formatContext({ ...baseContext, userId, authSuccess: true })
        );
      } else {
        invocationContext.warn(
          `[${correlationId}] ${method} ${path} - Authentication failed: ${reason || 'Unknown reason'}`,
          formatContext({ ...baseContext, authSuccess: false, authFailReason: reason })
        );
      }
    },

    /**
     * Log storage operations
     */
    logStorage: (operation: string, success: boolean, additionalContext?: LogContext) => {
      const level = success ? 'log' : 'warn';
      const status = success ? 'succeeded' : 'failed';
      
      invocationContext[level](
        `[${correlationId}] ${method} ${path} - Storage operation '${operation}' ${status}`,
        formatContext({ ...baseContext, storageOperation: operation, storageSuccess: success, ...additionalContext })
      );
    },
  };
}

/**
 * Create a simple logger that uses the InvocationContext
 * Useful for non-HTTP-triggered functions or utility functions
 * 
 * @param invocationContext - Azure Functions invocation context
 * @param correlationId - Optional correlation ID (generated if not provided)
 * @returns Simple logger object
 */
export function createSimpleLogger(invocationContext: InvocationContext, correlationId?: string) {
  const corrId = correlationId || generateCorrelationId();
  const functionName = invocationContext.functionName;
  
  return {
    correlationId: corrId,
    
    debug: (message: string, context?: LogContext) => {
      invocationContext.log(`[${corrId}] [DEBUG] ${message}`, formatContext({ functionName, correlationId: corrId, ...context }));
    },
    
    info: (message: string, context?: LogContext) => {
      invocationContext.log(`[${corrId}] [INFO] ${message}`, formatContext({ functionName, correlationId: corrId, ...context }));
    },
    
    warn: (message: string, context?: LogContext) => {
      invocationContext.warn(`[${corrId}] [WARN] ${message}`, formatContext({ functionName, correlationId: corrId, ...context }));
    },
    
    error: (message: string, context?: LogContext) => {
      invocationContext.error(`[${corrId}] [ERROR] ${message}`, formatContext({ functionName, correlationId: corrId, ...context }));
    },
  };
}

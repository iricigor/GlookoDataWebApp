/**
 * Tests for the centralized logger utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createLogger, 
  generateCorrelationId, 
  createApiLogger,
  logger,
  type LogContext 
} from './logger';

describe('logger', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCorrelationId', () => {
    it('should generate an 8-character string', () => {
      const id = generateCorrelationId();
      expect(id).toHaveLength(8);
    });

    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });

    it('should only contain hexadecimal characters', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('createLogger', () => {
    it('should create a logger with default configuration', () => {
      const testLogger = createLogger();
      expect(testLogger).toHaveProperty('debug');
      expect(testLogger).toHaveProperty('info');
      expect(testLogger).toHaveProperty('warn');
      expect(testLogger).toHaveProperty('error');
      expect(testLogger).toHaveProperty('withContext');
    });

    it('should log info messages', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      testLogger.info('Test message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      testLogger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      testLogger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should include context in log output', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      const context: LogContext = { correlationId: 'test123', endpoint: '/api/test' };
      testLogger.info('Test with context', context);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Test with context'),
        expect.objectContaining({ correlationId: 'test123', endpoint: '/api/test' })
      );
    });

    it('should respect minLevel configuration', () => {
      const testLogger = createLogger({ minLevel: 'warn' });
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should include custom app name in messages', () => {
      const testLogger = createLogger({ minLevel: 'info', appName: 'TestApp' });
      testLogger.info('Test message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestApp]')
      );
    });

    it('should include timestamp in messages by default', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      testLogger.info('Test message');
      
      // Check that the message contains a timestamp in ISO format
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T/)
      );
    });

    it('should allow omitting timestamp', () => {
      const testLogger = createLogger({ minLevel: 'info', includeTimestamp: false });
      testLogger.info('Test message');
      
      // Should not start with timestamp pattern
      expect(console.info).toHaveBeenCalledWith(
        expect.not.stringMatching(/^\[\d{4}-\d{2}-\d{2}T/)
      );
    });
  });

  describe('withContext', () => {
    it('should create a child logger with preset context', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      const childLogger = testLogger.withContext({ component: 'TestComponent' });
      
      childLogger.info('Test message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ component: 'TestComponent' })
      );
    });

    it('should merge additional context with preset context', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      const childLogger = testLogger.withContext({ component: 'TestComponent' });
      
      childLogger.info('Test message', { correlationId: 'abc123' });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ 
          component: 'TestComponent', 
          correlationId: 'abc123' 
        })
      );
    });

    it('should allow additional context to override preset context', () => {
      const testLogger = createLogger({ minLevel: 'info' });
      const childLogger = testLogger.withContext({ component: 'DefaultComponent' });
      
      childLogger.info('Test message', { component: 'OverrideComponent' });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ component: 'OverrideComponent' })
      );
    });
  });

  describe('createApiLogger', () => {
    it('should create an API logger with correlation ID', () => {
      const apiLogger = createApiLogger('/api/test');
      expect(apiLogger.correlationId).toBeDefined();
      expect(apiLogger.correlationId).toHaveLength(8);
    });

    it('should log start of API request', () => {
      const apiLogger = createApiLogger('/api/user/settings');
      apiLogger.logStart('GET');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('API GET request started'),
        expect.objectContaining({
          endpoint: '/api/user/settings',
          component: 'ApiClient',
          correlationId: apiLogger.correlationId,
        })
      );
    });

    it('should log successful API request with duration', async () => {
      const apiLogger = createApiLogger('/api/test');
      
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      apiLogger.logSuccess(200);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('API request completed successfully'),
        expect.objectContaining({
          endpoint: '/api/test',
          statusCode: 200,
          durationMs: expect.any(Number),
        })
      );
    });

    it('should log API request error with details', () => {
      const apiLogger = createApiLogger('/api/user/check-first-login');
      apiLogger.logError('Unauthorized', 'unauthorized', 401);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('API request failed'),
        expect.objectContaining({
          endpoint: '/api/user/check-first-login',
          error: 'Unauthorized',
          errorType: 'unauthorized',
          statusCode: 401,
          durationMs: expect.any(Number),
        })
      );
    });

    it('should allow additional context in all log methods', () => {
      const apiLogger = createApiLogger('/api/test');
      
      apiLogger.logStart('POST', { userId: 'user123' });
      expect(console.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: 'user123' })
      );

      apiLogger.logSuccess(201, { action: 'created' });
      expect(console.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ action: 'created' })
      );

      apiLogger.logError('Test error', 'test', 500, { retryCount: 1 });
      expect(console.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ retryCount: 1 })
      );
    });
  });

  describe('default logger instance', () => {
    it('should export a default logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should be usable for logging', () => {
      logger.info('Default logger test');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Default logger test')
      );
    });
  });
});

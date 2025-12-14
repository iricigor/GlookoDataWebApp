/**
 * Tests for Admin Test AI API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { testProAIKey } from './adminTestAIApi';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('adminTestAIApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('testProAIKey', () => {
    it('should return unauthorized error when token is empty', async () => {
      const result = await testProAIKey('');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return unauthorized error when token is whitespace only', async () => {
      const result = await testProAIKey('   ');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should successfully test infrastructure when testType is "infra"', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true,
          testType: 'infra',
          provider: 'perplexity',
          keyVaultName: 'test-kv',
          secretName: 'PERPLEXITY-API-KEY',
          secretExists: true,
          message: 'Infrastructure test successful'
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token', 'infra');

      expect(result).toEqual({
        success: true,
        testType: 'infra',
        provider: 'perplexity',
        keyVaultName: 'test-kv',
        secretName: 'PERPLEXITY-API-KEY',
        secretExists: true,
        message: 'Infrastructure test successful',
        statusCode: 200,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/glookoAdmin/test-ai-key?testType=infra',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should successfully test full AI when testType is "full"', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true,
          testType: 'full',
          provider: 'gemini',
          keyVaultName: 'prod-kv',
          secretName: 'GEMINI-API-KEY',
          secretExists: true,
          message: 'AI provider test successful. Response: Test response from AI'
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token', 'full');

      expect(result).toEqual({
        success: true,
        testType: 'full',
        provider: 'gemini',
        keyVaultName: 'prod-kv',
        secretName: 'GEMINI-API-KEY',
        secretExists: true,
        message: 'AI provider test successful. Response: Test response from AI',
        statusCode: 200,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/glookoAdmin/test-ai-key?testType=full',
        expect.any(Object)
      );
    });

    it('should default to "full" testType when not specified', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true,
          testType: 'full',
          provider: 'perplexity',
          keyVaultName: 'test-kv',
          secretName: 'PERPLEXITY-API-KEY',
          secretExists: true,
          message: 'Test successful'
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await testProAIKey('valid-token');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/glookoAdmin/test-ai-key?testType=full',
        expect.any(Object)
      );
    });

    it('should handle infrastructure test failure with secretExists false', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ 
          success: false,
          testType: 'infra',
          provider: 'grok',
          keyVaultName: 'test-kv',
          secretName: 'GROK-API-KEY',
          secretExists: false,
          error: 'Failed to retrieve secret: Secret not found'
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token', 'infra');

      expect(result.success).toBe(false);
      expect(result.secretExists).toBe(false);
      expect(result.error).toContain('Secret not found');
    });

    it('should handle 401 unauthorized error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token', errorType: 'unauthorized' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('invalid-token');

      expect(result).toEqual({
        success: false,
        error: 'Invalid token',
        errorType: 'unauthorized',
        statusCode: 401,
        testType: undefined,
        provider: undefined,
        keyVaultName: undefined,
        secretName: undefined,
        secretExists: undefined,
      });
    });

    it('should handle 403 forbidden error for non-Pro users', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: async () => ({ 
          error: 'Access denied. This endpoint requires Pro user access.',
          errorType: 'authorization' 
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Access denied. This endpoint requires Pro user access.',
        errorType: 'authorization',
        statusCode: 403,
        testType: undefined,
        provider: undefined,
        keyVaultName: undefined,
        secretName: undefined,
        secretExists: undefined,
      });
    });

    it('should handle 500 infrastructure error with configuration details', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ 
          error: 'Failed to retrieve API key configuration',
          errorType: 'infrastructure',
          testType: 'full',
          provider: 'deepseek',
          keyVaultName: 'test-kv',
          secretName: 'DEEPSEEK-API-KEY',
          secretExists: false,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token', 'full');

      expect(result).toEqual({
        success: false,
        error: 'Failed to retrieve API key configuration',
        errorType: 'infrastructure',
        statusCode: 500,
        testType: 'full',
        provider: 'deepseek',
        keyVaultName: 'test-kv',
        secretName: 'DEEPSEEK-API-KEY',
        secretExists: false,
      });
    });

    it('should handle 503 AI provider error', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        json: async () => ({ 
          error: 'AI provider test failed: API error (429): Rate limit exceeded',
          errorType: 'provider',
          testType: 'full',
          provider: 'perplexity',
          keyVaultName: 'test-kv',
          secretName: 'PERPLEXITY-API-KEY',
          secretExists: true,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token', 'full');

      expect(result).toEqual({
        success: false,
        error: 'AI provider test failed: API error (429): Rate limit exceeded',
        errorType: 'provider',
        statusCode: 503,
        testType: 'full',
        provider: 'perplexity',
        keyVaultName: 'test-kv',
        secretName: 'PERPLEXITY-API-KEY',
        secretExists: true,
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await testProAIKey('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Network error',
        errorType: 'network',
      });
    });

    it('should handle non-Error exceptions in network errors', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await testProAIKey('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Network error occurred',
        errorType: 'network',
      });
    });

    it('should use custom base URL when provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true,
          testType: 'infra',
          provider: 'perplexity',
          keyVaultName: 'test-kv',
          secretName: 'PERPLEXITY-API-KEY',
          secretExists: true,
          message: 'Test successful'
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await testProAIKey('valid-token', 'infra', {
        baseUrl: 'https://custom-api.example.com/api',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/api/glookoAdmin/test-ai-key?testType=infra',
        expect.any(Object)
      );
    });

    it('should include correlation ID in request headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true,
          testType: 'full',
          provider: 'perplexity',
          keyVaultName: 'test-kv',
          secretName: 'PERPLEXITY-API-KEY',
          secretExists: true,
          message: 'Test successful'
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await testProAIKey('valid-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String),
          }),
        })
      );
    });

    it('should handle JSON parsing errors in error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await testProAIKey('valid-token');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.errorType).toBe('infrastructure');
      expect(result.error).toBe('Request failed with status 500');
    });
  });
});

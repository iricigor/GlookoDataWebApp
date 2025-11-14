/**
 * Tests for DeepSeek API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callDeepSeekApi } from './deepseekApi';

describe('deepseekApi', () => {
  describe('callDeepSeekApi', () => {
    // Save original fetch
    const originalFetch = global.fetch;

    beforeEach(() => {
      // Reset fetch mock before each test
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Restore original fetch after each test
      global.fetch = originalFetch;
    });

    it('should return error when API key is empty', async () => {
      const result = await callDeepSeekApi('', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should return error when prompt is empty', async () => {
      const result = await callDeepSeekApi('test-key', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
      expect(result.errorType).toBe('api');
    });

    it('should return success with valid response', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'AI response text',
            },
            finish_reason: 'stop',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('AI response text');
      expect(result.error).toBeUndefined();
    });

    it('should trim whitespace from response content', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '  AI response with whitespace  \n',
            },
            finish_reason: 'stop',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('AI response with whitespace');
    });

    it('should handle 401 unauthorized error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const result = await callDeepSeekApi('invalid-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle 403 forbidden error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: { message: 'Access denied' } }),
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle API errors with error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ 
          error: { 
            message: 'API is temporarily unavailable',
            type: 'server_error',
          } 
        }),
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API is temporarily unavailable');
      expect(result.errorType).toBe('api');
    });

    it('should handle API errors without parseable JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('500 Internal Server Error');
      expect(result.errorType).toBe('api');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle unexpected errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        // Missing choices array
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response format from API');
      expect(result.errorType).toBe('api');
    });

    it('should use correct API endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'response' }, index: 0, finish_reason: 'stop' }],
        }),
      });
      global.fetch = mockFetch;

      await callDeepSeekApi('test-key', 'test prompt');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should send correct request headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'response' }, index: 0, finish_reason: 'stop' }],
        }),
      });
      global.fetch = mockFetch;

      await callDeepSeekApi('test-api-key', 'test prompt');
      
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      });
    });

    it('should send correct request body with deepseek-chat model', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'response' }, index: 0, finish_reason: 'stop' }],
        }),
      });
      global.fetch = mockFetch;

      await callDeepSeekApi('test-key', 'test prompt');
      
      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.model).toBe('deepseek-chat');
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toBe('test prompt');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(4000);
    });

    it('should handle token limit error in HTTP 200 response', async () => {
      // Some APIs can return HTTP 200 with an error object for token limit errors
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            message: 'Messages have 330258 tokens, which exceeds the max limit of 131072 tokens.',
            type: 'invalid_request_error',
            code: 'context_length_exceeded',
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('330258 tokens');
      expect(result.error).toContain('exceeds');
      expect(result.errorType).toBe('api');
    });

    it('should handle other errors in HTTP 200 response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.errorType).toBe('api');
    });
  });
});

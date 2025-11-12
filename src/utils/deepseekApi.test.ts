/**
 * Tests for DeepSeek API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callDeepSeekApi, type DeepSeekResponse, type DeepSeekError } from './deepseekApi';

describe('deepseekApi', () => {
  // Save original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('callDeepSeekApi', () => {
    it('should return error when API key is empty', async () => {
      const result = await callDeepSeekApi('', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should return error when API key is only whitespace', async () => {
      const result = await callDeepSeekApi('   ', 'test prompt');

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

    it('should return error when prompt is only whitespace', async () => {
      const result = await callDeepSeekApi('test-key', '   ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
      expect(result.errorType).toBe('api');
    });

    it('should successfully call API and return content', async () => {
      const mockResponse: DeepSeekResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a test response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.content).toBe('This is a test response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should send correct request body with system and user messages', async () => {
      const mockResponse: DeepSeekResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await callDeepSeekApi('test-key', 'analyze glucose data');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('deepseek-chat'),
        })
      );

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.model).toBe('deepseek-chat');
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toBe('analyze glucose data');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(1000);
    });

    it('should trim whitespace from response content', async () => {
      const mockResponse: DeepSeekResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '  Response with whitespace  ',
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
      expect(result.content).toBe('Response with whitespace');
    });

    it('should handle 401 unauthorized error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
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
        json: async () => ({}),
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle API error with error message', async () => {
      const mockError: DeepSeekError = {
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => mockError,
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.errorType).toBe('api');
    });

    it('should handle API error without parseable error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Failed to parse JSON');
        },
      });

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
      expect(result.error).toContain('Internal Server Error');
      expect(result.errorType).toBe('api');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle unknown error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Unknown error'));

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle non-Error exceptions', async () => {
      global.fetch = vi.fn().mockRejectedValue('string error');

      const result = await callDeepSeekApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle invalid response format - no choices', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [],
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

    it('should handle invalid response format - no message', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
          },
        ],
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
  });
});

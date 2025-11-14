/**
 * Tests for Perplexity API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callPerplexityApi } from './perplexityApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('perplexityApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('callPerplexityApi', () => {
    it('should return error if API key is empty', async () => {
      const result = await callPerplexityApi('', 'test prompt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(result.errorType).toBe('unauthorized');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error if prompt is empty', async () => {
      const result = await callPerplexityApi('test-key', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
      expect(result.errorType).toBe('api');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call Perplexity API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'test-id',
          model: 'sonar',
          created: 1234567890,
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: 'Test response from AI',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await callPerplexityApi('test-api-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response from AI');
    });

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error',
          },
        }),
      });

      const result = await callPerplexityApi('invalid-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue(new Error('Unknown error'));

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          choices: [],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
      expect(result.errorType).toBe('api');
    });

    it('should trim whitespace from AI response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: '  \n  Test response with whitespace  \n  ',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response with whitespace');
    });

    it('should include system message in API request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response',
              },
              delta: { role: 'assistant', content: '' },
            },
          ],
        }),
      });

      await callPerplexityApi('test-key', 'test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('medical assistant');
      expect(body.messages[0].content).toContain('mmol/L');
      expect(body.messages[0].content).toContain('second person');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toBe('test prompt');
    });

    it('should use correct model and parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response',
              },
              delta: { role: 'assistant', content: '' },
            },
          ],
        }),
      });

      await callPerplexityApi('test-key', 'test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.model).toBe('sonar');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(4000);
    });

    it('should handle token limit error in HTTP 200 response', async () => {
      // Some APIs can return HTTP 200 with an error object for token limit errors
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            message: 'Messages have 330258 tokens, which exceeds the max limit of 131072 tokens.',
            type: 'invalid_request_error',
            code: 'context_length_exceeded',
          },
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('330258 tokens');
      expect(result.error).toContain('exceeds');
      expect(result.errorType).toBe('api');
    });

    it('should handle other errors in HTTP 200 response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
          },
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.errorType).toBe('api');
    });

    it('should detect truncated response when finish_reason is length', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'length',
              message: {
                role: 'assistant',
                content: 'This is a truncated response',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.content).toContain('This is a truncated response');
      expect(result.content).toContain('⚠️');
      expect(result.content).toContain('truncated due to length limits');
    });

    it('should not mark response as truncated when finish_reason is stop', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: 'Complete response',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.truncated).toBe(false);
      expect(result.content).toBe('Complete response');
      expect(result.content).not.toContain('⚠️');
    });

    it('should retry with doubled tokens when response is truncated', async () => {
      // First call returns truncated response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'length',
              message: {
                role: 'assistant',
                content: 'This is a partial',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      // Second call (retry) returns complete response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: 'This is a complete response',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Check first call used default 4000 tokens
      const firstCall = mockFetch.mock.calls[0][1];
      const firstBody = JSON.parse(firstCall.body);
      expect(firstBody.max_tokens).toBe(4000);

      // Check second call used doubled 8000 tokens
      const secondCall = mockFetch.mock.calls[1][1];
      const secondBody = JSON.parse(secondCall.body);
      expect(secondBody.max_tokens).toBe(8000);

      // Final result should be the complete response from retry
      expect(result.success).toBe(true);
      expect(result.truncated).toBe(false);
      expect(result.content).toBe('This is a complete response');
      expect(result.content).not.toContain('⚠️');
    });

    it('should not retry if already at max tokens (8000)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'length',
              message: {
                role: 'assistant',
                content: 'Truncated at max',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt', 8000);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.content).toContain('⚠️');
      expect(result.content).toContain('truncated due to length limits');
    });
  });
});

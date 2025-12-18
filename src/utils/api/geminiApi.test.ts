/**
 * Tests for Google Gemini API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callGeminiApi, verifyGeminiApiKey } from './geminiApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('geminiApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('callGeminiApi', () => {
    it('should return error if API key is empty', async () => {
      const result = await callGeminiApi('', 'test prompt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(result.errorType).toBe('unauthorized');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error if prompt is empty', async () => {
      const result = await callGeminiApi('test-key', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
      expect(result.errorType).toBe('api');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call Gemini API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Test response from Gemini',
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response from Gemini');
    });

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            code: 401,
            message: 'Invalid API key',
            status: 'UNAUTHENTICATED',
          },
        }),
      });

      const result = await callGeminiApi('invalid-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle API error with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            code: 500,
            message: 'Server error occurred',
            status: 'INTERNAL',
          },
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error occurred');
      expect(result.errorType).toBe('api');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue(new Error('Unknown error'));

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [],
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
      expect(result.errorType).toBe('api');
    });

    it('should trim whitespace from AI response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '  \n  Test response with whitespace  \n  ',
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response with whitespace');
    });

    it('should include system prompt prefix in content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Response' }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
      });

      await callGeminiApi('test-api-key', 'test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.contents[0].parts[0].text).toContain('expert endocrinologist');
      expect(body.contents[0].parts[0].text).toContain('type-1 diabetes');
      expect(body.contents[0].parts[0].text).toContain('CGM/insulin pump data analysis');
      expect(body.contents[0].parts[0].text).toContain('test prompt');
    });

    it('should use correct model in URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Response' }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
      });

      await callGeminiApi('test-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-2.0-flash-exp'),
        expect.any(Object)
      );
    });

    it('should handle token limit error in HTTP 200 response', async () => {
      // Gemini API can return HTTP 200 with an error object for token limit errors
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            code: 400,
            message: 'Messages have 330258 tokens, which exceeds the max limit of 131072 tokens.',
            status: 'INVALID_ARGUMENT',
          },
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

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
            code: 429,
            message: 'Rate limit exceeded',
            status: 'RESOURCE_EXHAUSTED',
          },
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.errorType).toBe('api');
    });

    it('should detect truncated response when finishReason is MAX_TOKENS', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is a truncated response',
                  },
                ],
                role: 'model',
              },
              finishReason: 'MAX_TOKENS',
              index: 0,
            },
          ],
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.content).toContain('This is a truncated response');
      expect(result.content).toContain('⚠️');
      expect(result.content).toContain('truncated due to length limits');
    });

    it('should not mark response as truncated when finishReason is STOP', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Complete response',
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

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
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is a partial',
                  },
                ],
                role: 'model',
              },
              finishReason: 'MAX_TOKENS',
              index: 0,
            },
          ],
        }),
      });

      // Second call (retry) returns complete response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is a complete response',
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Check first call used default 4000 tokens
      const firstCall = mockFetch.mock.calls[0][1];
      const firstBody = JSON.parse(firstCall.body);
      expect(firstBody.generationConfig.maxOutputTokens).toBe(4000);

      // Check second call used doubled 8000 tokens
      const secondCall = mockFetch.mock.calls[1][1];
      const secondBody = JSON.parse(secondCall.body);
      expect(secondBody.generationConfig.maxOutputTokens).toBe(8000);

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
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Truncated at max',
                  },
                ],
                role: 'model',
              },
              finishReason: 'MAX_TOKENS',
              index: 0,
            },
          ],
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt', 8000);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.content).toContain('⚠️');
      expect(result.content).toContain('truncated due to length limits');
    });
  });

  describe('verifyGeminiApiKey', () => {
    it('should return invalid if API key is empty', async () => {
      const result = await verifyGeminiApiKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return invalid if API key is whitespace', async () => {
      const result = await verifyGeminiApiKey('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return valid on 200 OK response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
      });

      const result = await verifyGeminiApiKey('valid-key');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com/v1/models'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return invalid on 401 Unauthorized response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await verifyGeminiApiKey('invalid-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should return invalid on 403 Forbidden response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      const result = await verifyGeminiApiKey('forbidden-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should return invalid on other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await verifyGeminiApiKey('test-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API error: 500');
    });

    it('should return invalid on network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await verifyGeminiApiKey('test-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should return invalid on unknown error', async () => {
      mockFetch.mockRejectedValue(new Error('Something went wrong'));

      const result = await verifyGeminiApiKey('test-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });
  });
});

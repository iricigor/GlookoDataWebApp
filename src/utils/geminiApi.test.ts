/**
 * Tests for Google Gemini API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callGeminiApi } from './geminiApi';

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
      
      expect(body.contents[0].parts[0].text).toContain('medical assistant');
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
  });
});

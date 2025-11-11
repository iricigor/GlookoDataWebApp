/**
 * Tests for Gemini API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callGeminiApi, generateTimeInRangePrompt } from './geminiApi';

describe('geminiApi', () => {
  describe('callGeminiApi', () => {
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
      const result = await callGeminiApi('', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should return error when prompt is empty', async () => {
      const result = await callGeminiApi('test-key', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
      expect(result.errorType).toBe('api');
    });

    it('should return success with valid response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'AI response text' }],
              role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('AI response text');
      expect(result.error).toBeUndefined();
    });

    it('should trim whitespace from response content', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '  AI response with whitespace  \n' }],
              role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
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

      const result = await callGeminiApi('invalid-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key or unauthorized access');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle 403 forbidden error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: { message: 'Access denied' } }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key or unauthorized access');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle API error with error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            code: 500,
            message: 'Internal server error occurred',
            status: 'INTERNAL',
          },
        }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error occurred');
      expect(result.errorType).toBe('api');
    });

    it('should handle API error without error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API error: 500');
      expect(result.errorType).toBe('api');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle unknown errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Unknown error'));

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle invalid response format (no candidates)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response format from API');
      expect(result.errorType).toBe('api');
    });

    it('should handle invalid response format (empty candidates)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [] }),
      });

      const result = await callGeminiApi('test-key', 'test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response format from API');
      expect(result.errorType).toBe('api');
    });

    it('should make correct API call with proper headers and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
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
      
      global.fetch = mockFetch;

      await callGeminiApi('test-api-key', 'test prompt');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0];
      const body = JSON.parse(callArgs[1].body);

      expect(url).toContain('key=test-api-key');
      expect(url).toContain('gemini-2.0-flash-exp');
      expect(body.contents[0].parts[0].text).toContain('test prompt');
      expect(body.generationConfig.temperature).toBe(0.2);
      expect(body.generationConfig.maxOutputTokens).toBe(1000);
    });
  });

  describe('generateTimeInRangePrompt', () => {
    it('should generate prompt with correct TIR percentage', () => {
      const prompt = generateTimeInRangePrompt(75.5);
      
      expect(prompt).toContain('75.5%');
      expect(prompt).toContain('time-in-range');
      expect(prompt).toContain('70%');
    });

    it('should handle integer percentages', () => {
      const prompt = generateTimeInRangePrompt(80);
      
      expect(prompt).toContain('80.0%');
    });

    it('should handle low percentages', () => {
      const prompt = generateTimeInRangePrompt(45.2);
      
      expect(prompt).toContain('45.2%');
    });
  });
});

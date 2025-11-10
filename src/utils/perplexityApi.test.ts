/**
 * Tests for Perplexity API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callPerplexityApi, generateTimeInRangePrompt } from './perplexityApi';

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

  describe('generateTimeInRangePrompt', () => {
    it('should generate a prompt with the TIR percentage', () => {
      const prompt = generateTimeInRangePrompt(65.5);
      expect(prompt).toContain('65.5%');
      expect(prompt).toContain('time-in-range');
      expect(prompt).toContain('continuous glucose monitoring');
    });

    it('should include clinical context in the prompt', () => {
      const prompt = generateTimeInRangePrompt(80);
      expect(prompt).toContain('clinical assessment');
      expect(prompt).toContain('recommendations');
      expect(prompt).toContain('70%');
    });

    it('should format percentage to one decimal place', () => {
      const prompt = generateTimeInRangePrompt(66.66666);
      expect(prompt).toContain('66.7%');
    });
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

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            message: 'Access denied',
            type: 'permission_error',
          },
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle API error with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            message: 'Server error occurred',
            type: 'server_error',
          },
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error occurred');
      expect(result.errorType).toBe('api');
    });

    it('should handle API error without JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
      expect(result.errorType).toBe('api');
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
      expect(body.max_tokens).toBe(1000);
    });
  });
});

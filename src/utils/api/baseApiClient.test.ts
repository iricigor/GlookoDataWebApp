/**
 * Tests for base API client utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateInputs, 
  handleHttpError, 
  handleException,
  callOpenAICompatibleApi,
  type OpenAICompatibleConfig 
} from './baseApiClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('baseApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateInputs', () => {
    it('should return error if API key is empty', () => {
      const result = validateInputs('', 'test prompt');
      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('API key is required');
      expect(result?.errorType).toBe('unauthorized');
    });

    it('should return error if prompt is empty', () => {
      const result = validateInputs('test-key', '');
      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Prompt is required');
      expect(result?.errorType).toBe('api');
    });

    it('should return null for valid inputs', () => {
      const result = validateInputs('test-key', 'test prompt');
      expect(result).toBeNull();
    });
  });

  describe('handleHttpError', () => {
    it('should handle 401 unauthorized error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn(),
      } as unknown as Response;

      const result = await handleHttpError(mockResponse);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
      expect(result.error).toContain('Invalid API key');
    });

    it('should handle 403 forbidden error', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: vi.fn(),
      } as unknown as Response;

      const result = await handleHttpError(mockResponse);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
    });

    it('should parse error message from API response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            message: 'Custom error message',
            type: 'invalid_request',
          },
        }),
      } as unknown as Response;

      const result = await handleHttpError(mockResponse);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error message');
      expect(result.errorType).toBe('api');
    });

    it('should handle error when JSON parsing fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('Parse error')),
      } as unknown as Response;

      const result = await handleHttpError(mockResponse);
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
      expect(result.errorType).toBe('api');
    });
  });

  describe('handleException', () => {
    it('should handle network errors', () => {
      const error = new TypeError('fetch failed');
      const result = handleException(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const result = handleException(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle unknown error types', () => {
      const result = handleException('string error');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
      expect(result.errorType).toBe('unknown');
    });
  });

  describe('callOpenAICompatibleApi', () => {
    const mockConfig: OpenAICompatibleConfig = {
      url: 'https://api.test.com/chat/completions',
      model: 'test-model',
      finishReasonTruncated: 'length',
    };

    it('should validate API key before making request', async () => {
      const result = await callOpenAICompatibleApi(mockConfig, '', 'test prompt');
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate prompt before making request', async () => {
      const result = await callOpenAICompatibleApi(mockConfig, 'test-key', '');
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('api');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'test-id',
          model: 'test-model',
          created: 1234567890,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Test response',
              },
              finish_reason: 'stop',
            },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await callOpenAICompatibleApi(mockConfig, 'test-api-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response');
    });

    it('should handle successful response with truncation', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'test-id',
          choices: [
            {
              message: { content: 'Truncated response' },
              finish_reason: 'length',
            },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await callOpenAICompatibleApi(mockConfig, 'test-key', 'test prompt', 8000, true);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Truncated response');
      expect(result.content).toContain('⚠️');
      expect(result.truncated).toBe(true);
    });

    it('should retry when response is truncated and not already retrying', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: { content: 'Truncated' },
                  finish_reason: 'length',
                },
              ],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: 'Full response' },
                finish_reason: 'stop',
              },
            ],
          }),
        };
      });

      const result = await callOpenAICompatibleApi(mockConfig, 'test-key', 'test prompt', 4000);

      expect(callCount).toBe(2);
      expect(result.success).toBe(true);
      expect(result.content).toBe('Full response');
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({}),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await callOpenAICompatibleApi(mockConfig, 'invalid-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('fetch failed'));

      const result = await callOpenAICompatibleApi(mockConfig, 'test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('network');
    });

    it('should use custom temperature when provided', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const customConfig: OpenAICompatibleConfig = {
        ...mockConfig,
        temperature: 0.5,
      };

      await callOpenAICompatibleApi(customConfig, 'test-key', 'test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.temperature).toBe(0.5);
    });

    it('should handle API errors returned with HTTP 200', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          error: {
            message: 'API error despite 200 OK',
            type: 'api_error',
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await callOpenAICompatibleApi(mockConfig, 'test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error despite 200 OK');
      expect(result.errorType).toBe('api');
    });
  });
});

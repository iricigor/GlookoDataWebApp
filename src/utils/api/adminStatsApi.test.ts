/**
 * Tests for Admin Statistics API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLoggedInUsersCount } from './adminStatsApi';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('adminStatsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getLoggedInUsersCount', () => {
    it('should return unauthorized error when token is empty', async () => {
      const result = await getLoggedInUsersCount('');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return unauthorized error when token is whitespace only', async () => {
      const result = await getLoggedInUsersCount('   ');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should successfully fetch count when API returns 200', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ count: 42, proUsersCount: 5 }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getLoggedInUsersCount('valid-token');

      expect(result).toEqual({
        success: true,
        count: 42,
        proUsersCount: 5,
        statusCode: 200,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/stats/logged-in-users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token', errorType: 'unauthorized' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getLoggedInUsersCount('invalid-token');

      expect(result).toEqual({
        success: false,
        error: 'Invalid token',
        errorType: 'unauthorized',
        statusCode: 401,
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

      const result = await getLoggedInUsersCount('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Access denied. This endpoint requires Pro user access.',
        errorType: 'authorization',
        statusCode: 403,
      });
    });

    it('should handle 503 service unavailable error', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        json: async () => ({ 
          error: 'Service unavailable - storage not configured',
          errorType: 'infrastructure' 
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getLoggedInUsersCount('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Service unavailable - storage not configured',
        errorType: 'infrastructure',
        statusCode: 503,
      });
    });

    it('should handle 500 internal server error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ 
          error: 'Internal server error',
          errorType: 'infrastructure' 
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getLoggedInUsersCount('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Internal server error',
        errorType: 'infrastructure',
        statusCode: 500,
      });
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

      const result = await getLoggedInUsersCount('valid-token');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.errorType).toBe('infrastructure');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getLoggedInUsersCount('valid-token');

      expect(result).toEqual({
        success: false,
        error: 'Network error',
        errorType: 'network',
      });
    });

    it('should handle non-Error exceptions in network errors', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await getLoggedInUsersCount('valid-token');

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
        json: async () => ({ count: 10, proUsersCount: 2 }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await getLoggedInUsersCount('valid-token', {
        baseUrl: 'https://custom-api.example.com/api',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/api/stats/logged-in-users',
        expect.any(Object)
      );
    });

    it('should include correlation ID in request headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ count: 5, proUsersCount: 1 }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await getLoggedInUsersCount('valid-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String),
          }),
        })
      );
    });

    it('should handle missing error message in response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getLoggedInUsersCount('valid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request failed with status 400');
      expect(result.errorType).toBe('unknown');
    });
  });
});

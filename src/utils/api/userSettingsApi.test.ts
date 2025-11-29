/**
 * Tests for User Settings API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkFirstLogin, saveUserSettings, loadUserSettings } from './userSettingsApi';
import type { CloudUserSettings } from '../../types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample settings for testing
const sampleSettings: CloudUserSettings = {
  themeMode: 'dark',
  exportFormat: 'csv',
  responseLanguage: 'english',
  glucoseUnit: 'mmol/L',
  insulinDuration: 5,
  glucoseThresholds: {
    veryHigh: 13.9,
    high: 10.0,
    low: 3.9,
    veryLow: 3.0,
  },
};

describe('userSettingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('checkFirstLogin', () => {
    it('should return unauthorized error when access token is empty', async () => {
      const result = await checkFirstLogin('');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return unauthorized error when access token is whitespace only', async () => {
      const result = await checkFirstLogin('   ');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return success with isFirstLogin=true for new user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFirstLogin: true }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: true,
        isFirstLogin: true,
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/user/check-first-login', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should return success with isFirstLogin=false for returning user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFirstLogin: false, userId: 'user123' }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: true,
        isFirstLogin: false,
      });
    });

    it('should return unauthorized error for 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await checkFirstLogin('invalid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
        statusCode: 401,
      });
    });

    it('should return unauthorized error for 403 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
        statusCode: 403,
      });
    });

    it('should return infrastructure error for 500 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Internal server error. The infrastructure may not be ready or there are access issues.',
        errorType: 'infrastructure',
        statusCode: 500,
      });
    });

    it('should return infrastructure error for 503 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Internal server error. The infrastructure may not be ready or there are access issues.',
        errorType: 'infrastructure',
        statusCode: 503,
      });
    });

    it('should return infrastructure error when response mentions Table Storage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot connect to Table Storage' }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Cannot connect to Table Storage',
        errorType: 'infrastructure',
        statusCode: 400,
      });
    });

    it('should return infrastructure error when response mentions connection issues', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Database connection failed',
        errorType: 'infrastructure',
        statusCode: 400,
      });
    });

    it('should return unknown error for other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request format' }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Invalid request format',
        errorType: 'unknown',
        statusCode: 400,
      });
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.reject(new Error('Not JSON')),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'API error: 400 Bad Request',
        errorType: 'unknown',
        statusCode: 400,
      });
    });

    it('should return network error for fetch failures', async () => {
      const fetchError = new TypeError('fetch failed');
      mockFetch.mockRejectedValueOnce(fetchError);

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      });
    });

    it('should return unknown error for other exceptions', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Something unexpected happened'));

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Something unexpected happened',
        errorType: 'unknown',
      });
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFirstLogin: true }),
      });

      const customConfig = { baseUrl: 'https://my-function-app.azurewebsites.net/api' };
      await checkFirstLogin('valid-token', customConfig);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://my-function-app.azurewebsites.net/api/user/check-first-login',
        expect.any(Object)
      );
    });

    it('should handle message field in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Error from message field' }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Error from message field',
        errorType: 'unknown',
        statusCode: 400,
      });
    });

    it('should handle infrastructure keyword in error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'infrastructure error occurred' }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'infrastructure error occurred',
        errorType: 'infrastructure',
        statusCode: 400,
      });
    });

    it('should use structured errorType from API response when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Some error message',
          errorType: 'infrastructure' 
        }),
      });

      const result = await checkFirstLogin('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Some error message',
        errorType: 'infrastructure',
        statusCode: 400,
      });
    });
  });

  describe('saveUserSettings', () => {
    it('should return unauthorized error when token is empty', async () => {
      const result = await saveUserSettings('', sampleSettings, 'test@example.com');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should save settings successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await saveUserSettings('valid-token', sampleSettings, 'test@example.com');
      
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: sampleSettings, email: 'test@example.com' }),
      });
    });

    it('should return unauthorized error for 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await saveUserSettings('invalid-token', sampleSettings, 'test@example.com');
      
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
        statusCode: 401,
      });
    });

    it('should return infrastructure error for 500 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await saveUserSettings('valid-token', sampleSettings, 'test@example.com');
      
      expect(result).toEqual({
        success: false,
        error: 'Internal server error. Settings could not be saved.',
        errorType: 'infrastructure',
        statusCode: 500,
      });
    });

    it('should return network error for fetch failures', async () => {
      const fetchError = new TypeError('fetch failed');
      mockFetch.mockRejectedValueOnce(fetchError);

      const result = await saveUserSettings('valid-token', sampleSettings, 'test@example.com');
      
      expect(result).toEqual({
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      });
    });
  });

  describe('loadUserSettings', () => {
    it('should return unauthorized error when token is empty', async () => {
      const result = await loadUserSettings('');
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
        errorType: 'unauthorized',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should load settings successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ settings: sampleSettings }),
      });

      const result = await loadUserSettings('valid-token');
      
      expect(result).toEqual({
        success: true,
        settings: sampleSettings,
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/user/settings', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should return success with undefined settings for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await loadUserSettings('valid-token');
      
      expect(result).toEqual({
        success: true,
        settings: undefined,
      });
    });

    it('should return unauthorized error for 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await loadUserSettings('invalid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized access. Please log in again.',
        errorType: 'unauthorized',
        statusCode: 401,
      });
    });

    it('should return infrastructure error for 500 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await loadUserSettings('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Internal server error. Settings could not be loaded.',
        errorType: 'infrastructure',
        statusCode: 500,
      });
    });

    it('should return network error for fetch failures', async () => {
      const fetchError = new TypeError('fetch failed');
      mockFetch.mockRejectedValueOnce(fetchError);

      const result = await loadUserSettings('valid-token');
      
      expect(result).toEqual({
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      });
    });
  });
});

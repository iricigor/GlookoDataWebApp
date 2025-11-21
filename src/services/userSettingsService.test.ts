import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadUserSettings, saveUserSettings, isUserSettingsServiceAvailable } from './userSettingsService';
import type { UserSettings } from './userSettingsService';

// Mock fetch
global.fetch = vi.fn();

describe('userSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadUserSettings', () => {
    it('should load user settings successfully', async () => {
      const mockResponse = {
        value: [
          {
            PartitionKey: 'user@example.com',
            RowKey: 'settings',
            ThemeMode: 'dark',
            ExportFormat: 'tsv',
            ResponseLanguage: 'english',
            GlucoseThresholds: '{"veryHigh":14.0,"high":10.5,"low":4.0,"veryLow":3.5}',
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const settings = await loadUserSettings('user@example.com');

      expect(settings).toEqual({
        themeMode: 'dark',
        exportFormat: 'tsv',
        responseLanguage: 'english',
        glucoseThresholds: {
          veryHigh: 14.0,
          high: 10.5,
          low: 4.0,
          veryLow: 3.5,
        },
        insulinDuration: 5,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/data/UserSettings'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should return null when no settings found (404)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const settings = await loadUserSettings('user@example.com');
      expect(settings).toBeNull();
    });

    it('should return null when value array is empty', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: [] }),
      });

      const settings = await loadUserSettings('user@example.com');
      expect(settings).toBeNull();
    });

    it('should return null and log error on fetch failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const settings = await loadUserSettings('user@example.com');
      
      expect(settings).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should use default values for missing threshold data', async () => {
      const mockResponse = {
        value: [
          {
            PartitionKey: 'user@example.com',
            RowKey: 'settings',
            ThemeMode: 'light',
            ExportFormat: 'csv',
            ResponseLanguage: 'english',
            GlucoseThresholds: '',  // Empty string
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const settings = await loadUserSettings('user@example.com');

      expect(settings?.glucoseThresholds).toEqual({
        veryHigh: 13.9,
        high: 10.0,
        low: 3.9,
        veryLow: 3.0,
      });
    });
  });

  describe('saveUserSettings', () => {
    it('should save user settings successfully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      const settings: UserSettings = {
        themeMode: 'dark',
        exportFormat: 'tsv',
        responseLanguage: 'english',
        glucoseThresholds: {
          veryHigh: 14.0,
          high: 10.5,
          low: 4.0,
          veryLow: 3.5,
        },
      };

      const result = await saveUserSettings('user@example.com', settings);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/data/UserSettings',
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"PartitionKey":"user@example.com"'),
        })
      );
    });

    it('should return false on save failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const settings: UserSettings = {
        themeMode: 'light',
        exportFormat: 'csv',
        responseLanguage: 'english',
        glucoseThresholds: {
          veryHigh: 13.9,
          high: 10.0,
          low: 3.9,
          veryLow: 3.0,
        },
      };

      const result = await saveUserSettings('user@example.com', settings);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should return false on network error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const settings: UserSettings = {
        themeMode: 'system',
        exportFormat: 'csv',
        responseLanguage: 'english',
        glucoseThresholds: {
          veryHigh: 13.9,
          high: 10.0,
          low: 3.9,
          veryLow: 3.0,
        },
      };

      const result = await saveUserSettings('user@example.com', settings);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('isUserSettingsServiceAvailable', () => {
    it('should return true when service is available', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      const result = await isUserSettingsServiceAvailable();
      expect(result).toBe(true);
    });

    it('should return true when service returns 401 (auth required)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await isUserSettingsServiceAvailable();
      expect(result).toBe(true);
    });

    it('should return false when service is not available', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const result = await isUserSettingsServiceAvailable();
      expect(result).toBe(false);
    });
  });
});

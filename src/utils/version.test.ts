import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getVersionInfo, formatBuildDate } from './version';

// Mock the global constants
vi.stubGlobal('__APP_VERSION__', '1.0.0');
vi.stubGlobal('__BUILD_ID__', '123');
vi.stubGlobal('__BUILD_DATE__', '2025-11-09T12:00:00.000Z');

describe('version', () => {
  describe('getVersionInfo', () => {
    beforeEach(() => {
      vi.stubGlobal('__APP_VERSION__', '1.0.0');
      vi.stubGlobal('__BUILD_ID__', '123');
      vi.stubGlobal('__BUILD_DATE__', '2025-11-09T12:00:00.000Z');
    });

    it('should return version info with production build ID', () => {
      const info = getVersionInfo();
      
      expect(info.version).toBe('1.0.0');
      expect(info.buildId).toBe('123');
      expect(info.buildDate).toBe('2025-11-09T12:00:00.000Z');
      expect(info.fullVersion).toBe('1.0.0.123');
    });

    it('should return version info with dev build ID', () => {
      vi.stubGlobal('__BUILD_ID__', 'dev');
      
      const info = getVersionInfo();
      
      expect(info.version).toBe('1.0.0');
      expect(info.buildId).toBe('dev');
      expect(info.fullVersion).toBe('1.0.0-dev');
    });

    it('should handle all properties correctly', () => {
      const info = getVersionInfo();
      
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('buildId');
      expect(info).toHaveProperty('buildDate');
      expect(info).toHaveProperty('fullVersion');
    });
  });

  describe('formatBuildDate', () => {
    it('should format ISO date string correctly', () => {
      const formatted = formatBuildDate('2025-11-09T12:00:00.000Z');
      
      // Check that it returns a string with expected parts
      expect(formatted).toContain('2025');
      expect(formatted).toContain('November');
      expect(formatted).toContain('9');
    });

    it('should handle invalid date gracefully', () => {
      const invalidDate = 'invalid-date';
      const formatted = formatBuildDate(invalidDate);
      
      // Should return the original string if parsing fails
      expect(formatted).toBe(invalidDate);
    });

    it('should return a formatted string for valid dates', () => {
      const date = '2025-01-01T00:00:00.000Z';
      const formatted = formatBuildDate(date);
      
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});

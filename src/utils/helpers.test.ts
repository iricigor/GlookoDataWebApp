/**
 * Unit tests for utility helper functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatDate, formatNumber, isEmpty, delay } from '../utils/helpers';
import i18n from '../i18n';

describe('helpers', () => {
  let originalLanguage: string;

  beforeEach(() => {
    originalLanguage = i18n.language;
    i18n.language = 'en'; // Set to English for consistent tests
  });

  afterEach(() => {
    i18n.language = originalLanguage;
  });

  describe('formatDate', () => {
    it('should format a date with English locale', () => {
      i18n.language = 'en';
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      // English format includes slashes and month/day order
      expect(result).toMatch(/01\/15\/2025/);
    });

    it('should format a date with German locale', () => {
      i18n.language = 'de';
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      // German format includes dots and day/month order
      expect(result).toMatch(/15\.01\.2025/);
    });

    it('should handle December dates correctly', () => {
      i18n.language = 'en';
      const date = new Date('2025-12-31');
      const result = formatDate(date);
      expect(result).toMatch(/12\/31\/2025/);
    });
  });

  describe('formatNumber', () => {
    it('should format a number with 2 decimal places by default (English)', () => {
      i18n.language = 'en';
      const result = formatNumber(123.456);
      expect(result).toBe('123.46');
    });

    it('should format a number with German locale', () => {
      i18n.language = 'de';
      const result = formatNumber(123.456, 2);
      expect(result).toBe('123,46');
    });

    it('should format a number with specified decimal places', () => {
      i18n.language = 'en';
      const result = formatNumber(123.456, 1);
      expect(result).toBe('123.5');
    });

    it('should handle integers correctly', () => {
      i18n.language = 'en';
      const result = formatNumber(42);
      expect(result).toBe('42.00');
    });

    it('should format numbers with 0 decimal places', () => {
      i18n.language = 'en';
      const result = formatNumber(123.789, 0);
      expect(result).toBe('124');
    });

    it('should handle negative numbers', () => {
      i18n.language = 'en';
      const result = formatNumber(-45.678, 2);
      expect(result).toBe('-45.68');
    });

    it('should format large numbers with thousands separators (English)', () => {
      i18n.language = 'en';
      const result = formatNumber(1234.56, 2);
      expect(result).toBe('1,234.56');
    });

    it('should format large numbers with thousands separators (German)', () => {
      i18n.language = 'de';
      const result = formatNumber(1234.56, 2);
      expect(result).toBe('1.234,56');
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('should return false for number zero', () => {
      expect(isEmpty(0)).toBe(false);
    });

    it('should return false for boolean false', () => {
      expect(isEmpty(false)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isEmpty({})).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isEmpty([])).toBe(false);
    });
  });

  describe('delay', () => {
    it('should delay execution for specified milliseconds', async () => {
      const startTime = Date.now();
      await delay(100);
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Allow some margin for timing differences
      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(150);
    });

    it('should return a promise', () => {
      const result = delay(10);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve after delay', async () => {
      const result = await delay(10);
      expect(result).toBeUndefined();
    });
  });
});

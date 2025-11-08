/**
 * Unit tests for utility helper functions
 */

import { describe, it, expect } from 'vitest';
import { formatDate, formatNumber, isEmpty, delay } from '../utils/helpers';

describe('helpers', () => {
  describe('formatDate', () => {
    it('should format a date to MM/DD/YYYY format', () => {
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      expect(result).toBe('01/15/2025');
    });

    it('should pad single-digit months and days with leading zeros', () => {
      const date = new Date('2025-03-05');
      const result = formatDate(date);
      expect(result).toBe('03/05/2025');
    });

    it('should handle December dates correctly', () => {
      const date = new Date('2025-12-31');
      const result = formatDate(date);
      expect(result).toBe('12/31/2025');
    });
  });

  describe('formatNumber', () => {
    it('should format a number with 2 decimal places by default', () => {
      const result = formatNumber(123.456);
      expect(result).toBe('123.46');
    });

    it('should format a number with specified decimal places', () => {
      const result = formatNumber(123.456, 1);
      expect(result).toBe('123.5');
    });

    it('should handle integers correctly', () => {
      const result = formatNumber(42);
      expect(result).toBe('42.00');
    });

    it('should format numbers with 0 decimal places', () => {
      const result = formatNumber(123.789, 0);
      expect(result).toBe('124');
    });

    it('should handle negative numbers', () => {
      const result = formatNumber(-45.678, 2);
      expect(result).toBe('-45.68');
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

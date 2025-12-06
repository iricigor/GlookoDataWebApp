/**
 * Tests for localized formatting utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatNumber,
  formatDate,
  formatTime,
  formatDateTime,
  formatShortTime,
  formatShortDate,
  formatPercentage,
  formatGlucoseNumber,
  formatInsulinDose,
} from './formatters';
import i18n from '../../i18n';

describe('formatters', () => {
  // Mock i18n.language
  let originalLanguage: string;

  beforeEach(() => {
    originalLanguage = i18n.language;
  });

  afterEach(() => {
    i18n.language = originalLanguage;
  });

  describe('formatNumber', () => {
    it('should format number with English locale (default)', () => {
      i18n.language = 'en';
      expect(formatNumber(1234.56, 2)).toBe('1,234.56');
    });

    it('should format number with German locale', () => {
      i18n.language = 'de';
      expect(formatNumber(1234.56, 2)).toBe('1.234,56');
    });

    it('should handle different decimal places', () => {
      i18n.language = 'en';
      expect(formatNumber(1234.567, 0)).toBe('1,235');
      expect(formatNumber(1234.567, 1)).toBe('1,234.6');
      expect(formatNumber(1234.567, 3)).toBe('1,234.567');
    });

    it('should handle small numbers', () => {
      i18n.language = 'en';
      expect(formatNumber(5.5, 1)).toBe('5.5');
    });

    it('should handle zero', () => {
      i18n.language = 'en';
      expect(formatNumber(0, 2)).toBe('0.00');
    });

    it('should allow locale override', () => {
      i18n.language = 'en';
      expect(formatNumber(1234.56, 2, 'de')).toBe('1.234,56');
    });
  });

  describe('formatDate', () => {
    it('should format date with English locale', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31); // Dec 31, 2023
      const formatted = formatDate(date);
      // English format: MM/DD/YYYY
      expect(formatted).toMatch(/12\/31\/2023/);
    });

    it('should format date with German locale', () => {
      i18n.language = 'de';
      const date = new Date(2023, 11, 31); // Dec 31, 2023
      const formatted = formatDate(date);
      // German format: DD.MM.YYYY
      expect(formatted).toMatch(/31\.12\.2023/);
    });

    it('should accept custom options', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31);
      const formatted = formatDate(date, { month: 'long', day: 'numeric', year: 'numeric' });
      expect(formatted).toContain('December');
      expect(formatted).toContain('31');
      expect(formatted).toContain('2023');
    });

    it('should allow locale override', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31);
      const formatted = formatDate(date, undefined, 'de');
      expect(formatted).toMatch(/31\.12\.2023/);
    });
  });

  describe('formatTime', () => {
    it('should format time with English locale (12-hour)', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31, 14, 30); // 2:30 PM
      const formatted = formatTime(date);
      expect(formatted).toMatch(/[0-9]{1,2}:30/);
      expect(formatted.toLowerCase()).toContain('pm');
    });

    it('should format time with German locale (24-hour)', () => {
      i18n.language = 'de';
      const date = new Date(2023, 11, 31, 14, 30); // 14:30
      const formatted = formatTime(date);
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });

    it('should handle midnight', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31, 0, 0);
      const formatted = formatTime(date);
      expect(formatted).toMatch(/12:00/);
    });

    it('should allow locale override', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31, 14, 30);
      const formatted = formatTime(date, undefined, 'de');
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time with English locale', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31, 14, 30);
      const formatted = formatDateTime(date);
      expect(formatted).toContain('12');
      expect(formatted).toContain('31');
      expect(formatted).toContain('2023');
      expect(formatted).toMatch(/[0-9]{1,2}:30/);
    });

    it('should format date and time with German locale', () => {
      i18n.language = 'de';
      const date = new Date(2023, 11, 31, 14, 30);
      const formatted = formatDateTime(date);
      expect(formatted).toContain('31');
      expect(formatted).toContain('12');
      expect(formatted).toContain('2023');
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });
  });

  describe('formatShortTime', () => {
    it('should format short time with English locale', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31, 14, 30);
      const formatted = formatShortTime(date);
      expect(formatted).toMatch(/[0-9]{1,2}:30/);
    });

    it('should format short time with German locale', () => {
      i18n.language = 'de';
      const date = new Date(2023, 11, 31, 14, 30);
      const formatted = formatShortTime(date);
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });
  });

  describe('formatShortDate', () => {
    it('should format short date with English locale', () => {
      i18n.language = 'en';
      const date = new Date(2023, 11, 31);
      const formatted = formatShortDate(date);
      expect(formatted).toContain('12');
      expect(formatted).toContain('31');
    });

    it('should format short date with German locale', () => {
      i18n.language = 'de';
      const date = new Date(2023, 11, 31);
      const formatted = formatShortDate(date);
      expect(formatted).toContain('31');
      expect(formatted).toContain('12');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with English locale', () => {
      i18n.language = 'en';
      expect(formatPercentage(0.8567, 1)).toBe('85.7%');
      expect(formatPercentage(0.8567, 2)).toBe('85.67%');
    });

    it('should format percentage with German locale', () => {
      i18n.language = 'de';
      expect(formatPercentage(0.8567, 1)).toMatch(/85,7\s?%/);
    });

    it('should handle zero', () => {
      i18n.language = 'en';
      expect(formatPercentage(0, 1)).toBe('0.0%');
    });

    it('should handle 100%', () => {
      i18n.language = 'en';
      expect(formatPercentage(1, 0)).toBe('100%');
    });
  });

  describe('formatGlucoseNumber', () => {
    it('should format glucose with English locale', () => {
      i18n.language = 'en';
      expect(formatGlucoseNumber(5.5, 1)).toBe('5.5');
      expect(formatGlucoseNumber(100.5, 1)).toBe('100.5');
    });

    it('should format glucose with German locale', () => {
      i18n.language = 'de';
      expect(formatGlucoseNumber(5.5, 1)).toBe('5,5');
    });

    it('should handle different decimal places', () => {
      i18n.language = 'en';
      expect(formatGlucoseNumber(5.55, 0)).toBe('6');
      expect(formatGlucoseNumber(5.55, 2)).toBe('5.55');
    });
  });

  describe('formatInsulinDose', () => {
    it('should format insulin dose with English locale', () => {
      i18n.language = 'en';
      expect(formatInsulinDose(2.5, 2)).toBe('2.50');
      expect(formatInsulinDose(10.25, 2)).toBe('10.25');
    });

    it('should format insulin dose with German locale', () => {
      i18n.language = 'de';
      expect(formatInsulinDose(2.5, 2)).toBe('2,50');
    });

    it('should handle different decimal places', () => {
      i18n.language = 'en';
      expect(formatInsulinDose(2.567, 1)).toBe('2.6');
      expect(formatInsulinDose(2.567, 3)).toBe('2.567');
    });
  });

  describe('locale fallback', () => {
    it('should fallback to English when i18n.language is not set', () => {
      // @ts-expect-error - Testing fallback behavior
      i18n.language = undefined;
      const formatted = formatNumber(1234.56, 2);
      expect(formatted).toBe('1,234.56');
    });
  });
});

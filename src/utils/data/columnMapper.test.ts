/**
 * Unit tests for columnMapper utility
 */

import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  normalizeColumnName,
  findColumnIndex,
  getColumnVariants
} from './columnMapper';

describe('columnMapper', () => {
  describe('detectLanguage', () => {
    it('should detect English from column headers', () => {
      const englishHeaders = [
        'Timestamp',
        'Glucose Value (mg/dL)',
        'Device',
        'Notes'
      ];
      expect(detectLanguage(englishHeaders)).toBe('en');
    });

    it('should detect German from column headers', () => {
      const germanHeaders = [
        'Zeitstempel',
        'Glukosewert (mg/dl)',
        'Manuelles Lesen',
        'Seriennummer'
      ];
      expect(detectLanguage(germanHeaders)).toBe('de');
    });

    it('should detect German from insulin headers', () => {
      const germanHeaders = [
        'Zeitstempel',
        'Insulin-Typ',
        'Dauer (Minuten)',
        'Rate'
      ];
      expect(detectLanguage(germanHeaders)).toBe('de');
    });

    it('should default to English for empty headers', () => {
      expect(detectLanguage([])).toBe('en');
    });

    it('should default to English for unknown headers', () => {
      const unknownHeaders = ['Unknown1', 'Unknown2', 'Unknown3'];
      expect(detectLanguage(unknownHeaders)).toBe('en');
    });

    it('should detect English from bolus headers', () => {
      const englishHeaders = [
        'Timestamp',
        'Bolus Type',
        'Dose (units)',
        'Carbs (g)',
        'Notes'
      ];
      expect(detectLanguage(englishHeaders)).toBe('en');
    });

    it('should detect German from bolus headers', () => {
      const germanHeaders = [
        'Zeitstempel',
        'Insulin-Typ',
        'Blutzuckereingabe (mg/dl)',
        'Kohlenhydrataufnahme (g)',
        'Seriennummer'
      ];
      expect(detectLanguage(germanHeaders)).toBe('de');
    });
  });

  describe('normalizeColumnName', () => {
    it('should return original name for English language', () => {
      expect(normalizeColumnName('Timestamp', 'en')).toBe('Timestamp');
      expect(normalizeColumnName('Glucose Value (mg/dL)', 'en')).toBe('Glucose Value (mg/dL)');
    });

    it('should normalize German timestamp to English', () => {
      const result = normalizeColumnName('Zeitstempel', 'de');
      expect(result.toLowerCase()).toBe('timestamp');
    });

    it('should normalize German glucose columns to English', () => {
      const result1 = normalizeColumnName('Glukosewert (mg/dl)', 'de');
      expect(result1.toLowerCase()).toBe('glucose value');

      const result2 = normalizeColumnName('CGM-Glukosewert (mg/dl)', 'de');
      expect(result2.toLowerCase()).toBe('glucose value');
    });

    it('should normalize German insulin columns to English', () => {
      const result1 = normalizeColumnName('Insulin-Typ', 'de');
      expect(result1.toLowerCase()).toBe('insulin type');

      const result2 = normalizeColumnName('Abgegebenes Insulin (E)', 'de');
      expect(result2.toLowerCase()).toBe('dose');
    });

    it('should normalize German duration to English', () => {
      const result = normalizeColumnName('Dauer (Minuten)', 'de');
      expect(result.toLowerCase()).toBe('duration');
    });

    it('should return original name if no mapping found', () => {
      const unknownColumn = 'Unknown Column';
      expect(normalizeColumnName(unknownColumn, 'de')).toBe(unknownColumn);
    });

    it('should handle carbs columns', () => {
      const result1 = normalizeColumnName('KH (g)', 'de');
      expect(result1.toLowerCase()).toBe('carbs');

      const result2 = normalizeColumnName('Kohlenhydrataufnahme (g)', 'de');
      expect(result2.toLowerCase()).toBe('carbs');
    });
  });

  describe('findColumnIndex', () => {
    it('should find column by English name', () => {
      const headers = ['Timestamp', 'Glucose Value (mg/dL)', 'Device'];
      const index = findColumnIndex(headers, ['timestamp']);
      expect(index).toBe(0);
    });

    it('should find column by German name', () => {
      const headers = ['Zeitstempel', 'Glukosewert (mg/dl)', 'Seriennummer'];
      const index = findColumnIndex(headers, ['zeitstempel']);
      expect(index).toBe(0);
    });

    it('should find column using multiple search terms', () => {
      const headers = ['Timestamp', 'Glucose Value (mg/dL)', 'Device'];
      const index = findColumnIndex(headers, ['timestamp', 'zeitstempel']);
      expect(index).toBe(0);
    });

    it('should find German column using combined search terms', () => {
      const headers = ['Zeitstempel', 'Glukosewert (mg/dl)', 'Seriennummer'];
      const index = findColumnIndex(headers, ['glucose value', 'glukosewert']);
      expect(index).toBe(1);
    });

    it('should return -1 if column not found', () => {
      const headers = ['Timestamp', 'Device'];
      const index = findColumnIndex(headers, ['glucose value', 'glukosewert']);
      expect(index).toBe(-1);
    });

    it('should be case-insensitive', () => {
      const headers = ['TIMESTAMP', 'GLUCOSE VALUE (MG/DL)'];
      const index = findColumnIndex(headers, ['timestamp']);
      expect(index).toBe(0);
    });

    it('should handle partial matches', () => {
      const headers = ['Timestamp', 'CGM-Glukosewert (mg/dl)', 'Device'];
      const index = findColumnIndex(headers, ['glukosewert']);
      expect(index).toBe(1);
    });
  });

  describe('getColumnVariants', () => {
    it('should return both English and German variants for timestamp', () => {
      const variants = getColumnVariants('timestamp');
      expect(variants).toContain('timestamp');
      expect(variants).toContain('zeitstempel');
      expect(variants.length).toBeGreaterThan(0);
    });

    it('should return both English and German variants for glucoseValue', () => {
      const variants = getColumnVariants('glucoseValue');
      expect(variants).toContain('glucose value');
      expect(variants).toContain('glucose');
      expect(variants).toContain('glukosewert');
      expect(variants).toContain('cgm-glukosewert');
    });

    it('should return both English and German variants for dose', () => {
      const variants = getColumnVariants('dose');
      expect(variants).toContain('dose');
      expect(variants).toContain('delivered');
      expect(variants).toContain('abgegebenes insulin');
    });

    it('should return empty array for unknown column type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variants = getColumnVariants('unknownColumn' as any);
      expect(variants).toEqual([]);
    });

    it('should return variants for insulin totals', () => {
      const totalBolusVariants = getColumnVariants('totalBolus');
      expect(totalBolusVariants).toContain('total bolus');
      expect(totalBolusVariants).toContain('bolus gesamt');

      const totalBasalVariants = getColumnVariants('totalBasal');
      expect(totalBasalVariants).toContain('total basal');
      expect(totalBasalVariants).toContain('basal gesamt');

      const totalInsulinVariants = getColumnVariants('totalInsulin');
      expect(totalInsulinVariants).toContain('total insulin');
      expect(totalInsulinVariants).toContain('insulin gesamt');
    });
  });
});

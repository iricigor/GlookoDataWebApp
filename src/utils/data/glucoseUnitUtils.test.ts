/**
 * Unit tests for glucose unit conversion utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MMOL_TO_MGDL,
  mmolToMgdl,
  mgdlToMmol,
  convertGlucoseValue,
  formatGlucoseValue,
  displayGlucoseValue,
  getUnitLabel,
  detectGlucoseUnit,
} from './glucoseUnitUtils';
import i18n from '../../i18n';

describe('glucoseUnitUtils', () => {
  let originalLanguage: string;

  beforeEach(() => {
    originalLanguage = i18n.language;
    i18n.language = 'en'; // Set to English for consistent tests
  });

  afterEach(() => {
    i18n.language = originalLanguage;
  });
  describe('MMOL_TO_MGDL constant', () => {
    it('should have the correct conversion factor', () => {
      expect(MMOL_TO_MGDL).toBe(18.018);
    });
  });

  describe('mmolToMgdl', () => {
    it('should convert mmol/L to mg/dL correctly', () => {
      expect(mmolToMgdl(5.0)).toBe(90); // 5 * 18.018 = 90.09 → 90
      expect(mmolToMgdl(10.0)).toBe(180); // 10 * 18.018 = 180.18 → 180
      expect(mmolToMgdl(7.0)).toBe(126); // 7 * 18.018 = 126.126 → 126
    });

    it('should round to nearest integer', () => {
      expect(mmolToMgdl(5.5)).toBe(99); // 5.5 * 18.018 = 99.099 → 99
      expect(mmolToMgdl(6.1)).toBe(110); // 6.1 * 18.018 = 109.9098 → 110
    });

    it('should handle edge cases', () => {
      expect(mmolToMgdl(0)).toBe(0);
      expect(mmolToMgdl(1)).toBe(18); // 1 * 18.018 = 18.018 → 18
    });
  });

  describe('mgdlToMmol', () => {
    it('should convert mg/dL to mmol/L correctly', () => {
      expect(mgdlToMmol(90)).toBe(5.0); // 90 / 18.018 = 4.995... → 5.0
      expect(mgdlToMmol(180)).toBe(10.0); // 180 / 18.018 = 9.990... → 10.0
      expect(mgdlToMmol(126)).toBe(7.0); // 126 / 18.018 = 6.993... → 7.0
    });

    it('should round to 1 decimal place', () => {
      expect(mgdlToMmol(100)).toBe(5.6); // 100 / 18.018 = 5.549... → 5.6
      expect(mgdlToMmol(200)).toBe(11.1); // 200 / 18.018 = 11.099... → 11.1
    });

    it('should handle edge cases', () => {
      expect(mgdlToMmol(0)).toBe(0);
      expect(mgdlToMmol(18)).toBe(1.0); // 18 / 18.018 = 0.999... → 1.0
    });
  });

  describe('convertGlucoseValue', () => {
    it('should convert to mg/dL when targetUnit is mg/dL', () => {
      expect(convertGlucoseValue(5.0, 'mg/dL')).toBe(90);
      expect(convertGlucoseValue(10.0, 'mg/dL')).toBe(180);
    });

    it('should keep mmol/L value unchanged when targetUnit is mmol/L', () => {
      expect(convertGlucoseValue(5.0, 'mmol/L')).toBe(5.0);
      expect(convertGlucoseValue(10.0, 'mmol/L')).toBe(10.0);
      expect(convertGlucoseValue(7.5, 'mmol/L')).toBe(7.5);
    });
  });

  describe('formatGlucoseValue', () => {
    it('should format mg/dL as integer', () => {
      expect(formatGlucoseValue(90, 'mg/dL')).toBe('90');
      expect(formatGlucoseValue(90.5, 'mg/dL')).toBe('91'); // rounded
      expect(formatGlucoseValue(180, 'mg/dL')).toBe('180');
    });

    it('should format mmol/L with 1 decimal place (English)', () => {
      i18n.language = 'en';
      expect(formatGlucoseValue(5.0, 'mmol/L')).toBe('5.0');
      expect(formatGlucoseValue(5.55, 'mmol/L')).toBe('5.6'); // Standard rounding: 5.55 -> 5.6
      expect(formatGlucoseValue(10.12, 'mmol/L')).toBe('10.1');
    });

    it('should format mmol/L with 1 decimal place (German)', () => {
      i18n.language = 'de';
      expect(formatGlucoseValue(5.0, 'mmol/L')).toBe('5,0');
      expect(formatGlucoseValue(5.55, 'mmol/L')).toBe('5,6'); // Standard rounding: 5.55 -> 5.6
      expect(formatGlucoseValue(10.12, 'mmol/L')).toBe('10,1');
    });
  });

  describe('displayGlucoseValue', () => {
    it('should convert and format mmol/L to mg/dL', () => {
      expect(displayGlucoseValue(5.0, 'mg/dL')).toBe('90');
      expect(displayGlucoseValue(10.0, 'mg/dL')).toBe('180');
      expect(displayGlucoseValue(7.0, 'mg/dL')).toBe('126');
    });

    it('should format mmol/L with 1 decimal place (English)', () => {
      i18n.language = 'en';
      expect(displayGlucoseValue(5.0, 'mmol/L')).toBe('5.0');
      expect(displayGlucoseValue(10.0, 'mmol/L')).toBe('10.0');
      expect(displayGlucoseValue(7.5, 'mmol/L')).toBe('7.5');
    });

    it('should format mmol/L with 1 decimal place (German)', () => {
      i18n.language = 'de';
      expect(displayGlucoseValue(5.0, 'mmol/L')).toBe('5,0');
      expect(displayGlucoseValue(10.0, 'mmol/L')).toBe('10,0');
      expect(displayGlucoseValue(7.5, 'mmol/L')).toBe('7,5');
    });
  });

  describe('getUnitLabel', () => {
    it('should return correct label for mmol/L', () => {
      expect(getUnitLabel('mmol/L')).toBe('mmol/L');
    });

    it('should return correct label for mg/dL', () => {
      expect(getUnitLabel('mg/dL')).toBe('mg/dL');
    });
  });

  describe('round-trip conversion', () => {
    it('should approximately preserve values through round-trip conversion', () => {
      const originalMmol = 5.5;
      const mgdl = mmolToMgdl(originalMmol);
      const backToMmol = mgdlToMmol(mgdl);
      
      // Allow small rounding difference
      expect(Math.abs(backToMmol - originalMmol)).toBeLessThan(0.1);
    });

    it('should handle common glucose values', () => {
      // Test typical glucose ranges
      const testValues = [3.9, 5.0, 7.0, 10.0, 13.9];
      
      testValues.forEach(mmol => {
        const mgdl = mmolToMgdl(mmol);
        const backToMmol = mgdlToMmol(mgdl);
        expect(Math.abs(backToMmol - mmol)).toBeLessThan(0.2);
      });
    });
  });

  describe('typical glucose threshold values', () => {
    it('should convert common threshold values correctly', () => {
      // Common thresholds in mmol/L and their mg/dL equivalents
      expect(mmolToMgdl(3.9)).toBe(70);  // Very low threshold
      expect(mmolToMgdl(3.0)).toBe(54);  // Very low threshold (alternate)
      expect(mmolToMgdl(10.0)).toBe(180); // High threshold
      expect(mmolToMgdl(13.9)).toBe(250); // Very high threshold
    });
  });

  describe('detectGlucoseUnit', () => {
    it('should detect mg/dL unit from column headers', () => {
      const headers = ['Timestamp', 'Glucose Value (mg/dL)', 'Device', 'Notes'];
      expect(detectGlucoseUnit(headers)).toBe('mg/dL');
    });

    it('should detect mmol/L unit from column headers', () => {
      const headers = ['Timestamp', 'Glucose Value (mmol/L)', 'Trend Arrow', 'Transmitter ID'];
      expect(detectGlucoseUnit(headers)).toBe('mmol/L');
    });

    it('should be case-insensitive', () => {
      expect(detectGlucoseUnit(['Timestamp', 'Glucose Value (MG/DL)', 'Device'])).toBe('mg/dL');
      expect(detectGlucoseUnit(['Timestamp', 'Glucose Value (MMOL/L)', 'Device'])).toBe('mmol/L');
      expect(detectGlucoseUnit(['Timestamp', 'glucose value (mg/dl)', 'Device'])).toBe('mg/dL');
    });

    it('should handle variations in unit format', () => {
      expect(detectGlucoseUnit(['Timestamp', 'Glucose Value (mg/dl)', 'Device'])).toBe('mg/dL');
      expect(detectGlucoseUnit(['Timestamp', 'Glucose Value (mmol)', 'Device'])).toBe('mmol/L');
      expect(detectGlucoseUnit(['Timestamp', 'Glucose (mg/dL)', 'Device'])).toBe('mg/dL');
    });

    it('should return null when no glucose column found', () => {
      const headers = ['Timestamp', 'Blood Pressure', 'Device'];
      expect(detectGlucoseUnit(headers)).toBeNull();
    });

    it('should return null when glucose column has no unit in parentheses', () => {
      const headers = ['Timestamp', 'Glucose Value', 'Device'];
      expect(detectGlucoseUnit(headers)).toBeNull();
    });

    it('should return null when unit is not recognized', () => {
      const headers = ['Timestamp', 'Glucose Value (unknown)', 'Device'];
      expect(detectGlucoseUnit(headers)).toBeNull();
    });

    it('should detect mg/dL from German column headers', () => {
      const germanHeaders = ['Zeitstempel', 'Glukosewert (mg/dl)', 'Manuelles Lesen', 'Seriennummer'];
      expect(detectGlucoseUnit(germanHeaders)).toBe('mg/dL');
    });

    it('should detect mmol/L from German column headers', () => {
      const germanHeaders = ['Zeitstempel', 'Glukosewert (mmol/l)', 'Manuelles Lesen', 'Seriennummer'];
      expect(detectGlucoseUnit(germanHeaders)).toBe('mmol/L');
    });

    it('should detect from CGM German column headers', () => {
      const germanHeaders = ['Zeitstempel', 'CGM-Glukosewert (mg/dl)', 'Seriennummer'];
      expect(detectGlucoseUnit(germanHeaders)).toBe('mg/dL');
    });
  });
});

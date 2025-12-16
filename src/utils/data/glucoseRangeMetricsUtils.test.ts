/**
 * Unit tests for glucose range metrics utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAverageGlucose,
  calculateEstimatedHbA1c,
  convertHbA1cToMmolMol,
  calculateDaysWithData,
  MIN_DAYS_FOR_RELIABLE_HBA1C,
  calculateCV,
  CV_TARGET_THRESHOLD,
  calculateBGRI,
  calculateLBGI,
  calculateHBGI,
  calculateJIndex,
  calculateMedianGlucose,
  calculateStandardDeviation,
  calculateQuartiles,
  countHighLowIncidents,
  countUnicorns,
  calculateFlux,
  calculateWakeupAverage,
  calculateBedtimeAverage,
} from './glucoseRangeMetricsUtils';
import { MMOL_TO_MGDL } from './glucoseUnitUtils';
import type { GlucoseReading, GlucoseThresholds } from '../../types';

// Standard thresholds in mmol/L
const standardThresholds: GlucoseThresholds = {
  veryLow: 3.0,
  low: 3.9,
  high: 10.0,
  veryHigh: 13.9,
};

describe('glucoseRangeMetricsUtils', () => {
  describe('calculateAverageGlucose', () => {
    it('should return null for empty readings', () => {
      expect(calculateAverageGlucose([])).toBeNull();
    });

    it('should calculate average glucose correctly', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      expect(calculateAverageGlucose(readings)).toBe(6.0);
    });

    it('should handle single reading', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateAverageGlucose(readings)).toBe(5.5);
    });
  });

  describe('calculateEstimatedHbA1c', () => {
    it('should calculate estimated HbA1c using ADA formula', () => {
      // For average glucose of 5.4 mmol/L (about 97 mg/dL), HbA1c should be around 5.0%
      // Formula: (5.4 + 2.59) / 1.59 = 5.03
      const result = calculateEstimatedHbA1c(5.4);
      expect(result).toBeCloseTo(5.03, 1);
    });

    it('should calculate correct HbA1c for higher glucose levels', () => {
      // For average glucose of 8.6 mmol/L (about 155 mg/dL), HbA1c should be around 7.0%
      // Formula: (8.6 + 2.59) / 1.59 = 7.04
      const result = calculateEstimatedHbA1c(8.6);
      expect(result).toBeCloseTo(7.04, 1);
    });

    it('should calculate correct HbA1c for low average glucose', () => {
      // For average glucose of 3.5 mmol/L (about 63 mg/dL)
      // Formula: (3.5 + 2.59) / 1.59 = 3.83
      const result = calculateEstimatedHbA1c(3.5);
      expect(result).toBeCloseTo(3.83, 1);
    });
  });

  describe('convertHbA1cToMmolMol', () => {
    it('should convert HbA1c 5.0% to approximately 31 mmol/mol', () => {
      // Formula: (5.0 - 2.15) × 10.929 = 31.15
      const result = convertHbA1cToMmolMol(5.0);
      expect(result).toBeCloseTo(31.15, 0);
    });

    it('should convert HbA1c 7.0% to approximately 53 mmol/mol', () => {
      // Formula: (7.0 - 2.15) × 10.929 = 53.0
      const result = convertHbA1cToMmolMol(7.0);
      expect(result).toBeCloseTo(53.0, 0);
    });

    it('should convert HbA1c 6.5% to approximately 48 mmol/mol', () => {
      // Formula: (6.5 - 2.15) × 10.929 = 47.5
      const result = convertHbA1cToMmolMol(6.5);
      expect(result).toBeCloseTo(47.5, 0);
    });
  });

  describe('calculateDaysWithData', () => {
    it('should return 0 for empty readings', () => {
      expect(calculateDaysWithData([])).toBe(0);
    });

    it('should count unique days correctly', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-16T09:00:00'), value: 5.8 },
        { timestamp: new Date('2024-01-16T14:00:00'), value: 6.2 },
        { timestamp: new Date('2024-01-17T08:00:00'), value: 5.9 },
      ];
      expect(calculateDaysWithData(readings)).toBe(3);
    });

    it('should handle single day', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      expect(calculateDaysWithData(readings)).toBe(1);
    });
  });

  describe('MIN_DAYS_FOR_RELIABLE_HBA1C', () => {
    it('should be 60 days', () => {
      expect(MIN_DAYS_FOR_RELIABLE_HBA1C).toBe(60);
    });
  });

  describe('CV_TARGET_THRESHOLD', () => {
    it('should be 36%', () => {
      expect(CV_TARGET_THRESHOLD).toBe(36);
    });
  });

  describe('calculateCV', () => {
    it('should return null for empty readings', () => {
      expect(calculateCV([])).toBeNull();
    });

    it('should return null for single reading (need at least 2)', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateCV(readings)).toBeNull();
    });

    it('should calculate CV% correctly for two readings', () => {
      // Two readings: 4.0 and 6.0 mmol/L
      // Mean = 5.0, SD = sqrt(((4-5)^2 + (6-5)^2) / 1) = sqrt(2) ≈ 1.414
      // CV = (1.414 / 5.0) * 100 ≈ 28.28%
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const cv = calculateCV(readings);
      expect(cv).toBeCloseTo(28.28, 1);
    });

    it('should calculate CV% correctly for multiple readings', () => {
      // Readings: 5.0, 6.0, 7.0 mmol/L
      // Mean = 6.0
      // Variance = ((5-6)^2 + (6-6)^2 + (7-6)^2) / 2 = (1 + 0 + 1) / 2 = 1
      // SD = sqrt(1) = 1.0
      // CV = (1.0 / 6.0) * 100 ≈ 16.67%
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      const cv = calculateCV(readings);
      expect(cv).toBeCloseTo(16.67, 1);
    });

    it('should return 0 for identical readings (no variability)', () => {
      // All readings are 5.5 mmol/L
      // SD = 0, CV = 0%
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      const cv = calculateCV(readings);
      expect(cv).toBe(0);
    });

    it('should indicate stable control when CV ≤ 36%', () => {
      // Readings with low variability
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 5.8 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 5.2 },
      ];
      const cv = calculateCV(readings);
      expect(cv).not.toBeNull();
      expect(cv!).toBeLessThanOrEqual(CV_TARGET_THRESHOLD);
    });

    it('should indicate high variability when CV > 36%', () => {
      // Readings with high variability
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 8.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 12.0 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 5.0 },
      ];
      const cv = calculateCV(readings);
      expect(cv).not.toBeNull();
      expect(cv!).toBeGreaterThan(CV_TARGET_THRESHOLD);
    });
  });

  describe('MMOL_TO_MGDL', () => {
    it('should be approximately 18.018', () => {
      expect(MMOL_TO_MGDL).toBeCloseTo(18.018, 3);
    });
  });

  describe('calculateBGRI', () => {
    it('should return null for empty readings', () => {
      expect(calculateBGRI([])).toBeNull();
    });

    it('should calculate LBGI, HBGI, and BGRI for normal glucose values', () => {
      // Readings around 100 mg/dL (5.5 mmol/L) - near euglycemic level
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      expect(result!.lbgi).toBeGreaterThanOrEqual(0);
      expect(result!.hbgi).toBeGreaterThanOrEqual(0);
      expect(result!.bgri).toBeCloseTo(result!.lbgi + result!.hbgi, 5);
    });

    it('should calculate higher LBGI for hypoglycemic readings', () => {
      // Low glucose readings (hypoglycemia range)
      const lowReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.0 },  // ~54 mg/dL
        { timestamp: new Date('2024-01-15T11:00:00'), value: 3.5 },  // ~63 mg/dL
        { timestamp: new Date('2024-01-15T12:00:00'), value: 3.2 },  // ~58 mg/dL
      ];
      
      // Normal glucose readings
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.8 },
      ];
      
      const lowResult = calculateBGRI(lowReadings);
      const normalResult = calculateBGRI(normalReadings);
      
      expect(lowResult!.lbgi).toBeGreaterThan(normalResult!.lbgi);
    });

    it('should calculate higher HBGI for hyperglycemic readings', () => {
      // High glucose readings (hyperglycemia range)
      const highReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 15.0 },  // ~270 mg/dL
        { timestamp: new Date('2024-01-15T11:00:00'), value: 16.0 },  // ~288 mg/dL
        { timestamp: new Date('2024-01-15T12:00:00'), value: 14.0 },  // ~252 mg/dL
      ];
      
      // Normal glucose readings
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.8 },
      ];
      
      const highResult = calculateBGRI(highReadings);
      const normalResult = calculateBGRI(normalReadings);
      
      expect(highResult!.hbgi).toBeGreaterThan(normalResult!.hbgi);
    });

    it('should have BGRI equal to LBGI + HBGI', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.5 },  // Low
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },  // Normal
        { timestamp: new Date('2024-01-15T12:00:00'), value: 12.0 }, // High
      ];
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      expect(result!.bgri).toBeCloseTo(result!.lbgi + result!.hbgi, 10);
    });

    it('should handle mixed readings correctly', () => {
      // Mix of low, normal, and high readings
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T08:00:00'), value: 2.8 },   // Very low
        { timestamp: new Date('2024-01-15T09:00:00'), value: 5.5 },   // Normal
        { timestamp: new Date('2024-01-15T10:00:00'), value: 7.0 },   // Normal
        { timestamp: new Date('2024-01-15T11:00:00'), value: 15.0 },  // High
      ];
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      // Both LBGI and HBGI should be > 0 due to mixed values
      expect(result!.lbgi).toBeGreaterThan(0);
      expect(result!.hbgi).toBeGreaterThan(0);
    });

    it('should return low risk values for well-controlled readings', () => {
      // Well-controlled glucose around 100 mg/dL (5.5 mmol/L)
      const readings: GlucoseReading[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(`2024-01-15T${(10 + i).toString().padStart(2, '0')}:00:00`),
        value: 5.5 + (i % 2 === 0 ? 0.2 : -0.2),  // Small variation around 5.5
      }));
      
      const result = calculateBGRI(readings);
      
      expect(result).not.toBeNull();
      // Low risk indices for well-controlled glucose
      expect(result!.lbgi).toBeLessThan(2.5);  // Low hypoglycemia risk
      expect(result!.hbgi).toBeLessThan(4.5);  // Low hyperglycemia risk
    });
  });

  describe('calculateLBGI', () => {
    it('should return null for empty readings', () => {
      expect(calculateLBGI([])).toBeNull();
    });

    it('should return LBGI value', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const lbgi = calculateLBGI(readings);
      
      expect(lbgi).not.toBeNull();
      expect(typeof lbgi).toBe('number');
    });
  });

  describe('calculateHBGI', () => {
    it('should return null for empty readings', () => {
      expect(calculateHBGI([])).toBeNull();
    });

    it('should return HBGI value', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const hbgi = calculateHBGI(readings);
      
      expect(hbgi).not.toBeNull();
      expect(typeof hbgi).toBe('number');
    });
  });

  describe('calculateJIndex', () => {
    it('should return null for empty readings', () => {
      expect(calculateJIndex([])).toBeNull();
    });

    it('should return null for single reading (need at least 2)', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateJIndex(readings)).toBeNull();
    });

    it('should calculate J-Index for multiple readings', () => {
      // Readings: 5.0, 6.0, 7.0 mmol/L
      // Mean = 6.0 mmol/L = 108 mg/dL
      // SD = 1.0 mmol/L = 18 mg/dL
      // J-Index = 0.001 × (108 + 18)² = 0.001 × 15876 = 15.876
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      const jIndex = calculateJIndex(readings);
      
      expect(jIndex).not.toBeNull();
      expect(jIndex).toBeGreaterThan(0);
      // Expected: ~15.9 (accounting for exact conversion factor)
      expect(jIndex!).toBeCloseTo(15.9, 0);
    });

    it('should return lower J-Index for stable readings', () => {
      // All readings close to 5.5 mmol/L (low variability)
      const stableReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.4 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.6 },
      ];
      
      // Readings with higher variability
      const variableReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      
      const stableJIndex = calculateJIndex(stableReadings);
      const variableJIndex = calculateJIndex(variableReadings);
      
      expect(stableJIndex).not.toBeNull();
      expect(variableJIndex).not.toBeNull();
      expect(stableJIndex!).toBeLessThan(variableJIndex!);
    });

    it('should return higher J-Index for higher mean glucose', () => {
      // Normal mean (~5.5 mmol/L)
      const normalReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 6.0 },
      ];
      
      // High mean (~10 mmol/L)
      const highReadings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 9.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 10.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 10.5 },
      ];
      
      const normalJIndex = calculateJIndex(normalReadings);
      const highJIndex = calculateJIndex(highReadings);
      
      expect(normalJIndex).not.toBeNull();
      expect(highJIndex).not.toBeNull();
      expect(highJIndex!).toBeGreaterThan(normalJIndex!);
    });

    it('should calculate J-Index correctly for typical diabetes range', () => {
      // Mean ~8.6 mmol/L (~155 mg/dL), SD ~1.5 mmol/L (~27 mg/dL)
      // J-Index = 0.001 × (155 + 27)² = 0.001 × 33124 = 33.12
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 7.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 8.6 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 10.2 },
      ];
      const jIndex = calculateJIndex(readings);
      
      expect(jIndex).not.toBeNull();
      // J-Index > 30 indicates fair-to-poor control
      expect(jIndex!).toBeGreaterThan(25);
      expect(jIndex!).toBeLessThan(40);
    });

    it('should be 0 when all readings are identical (but SD would be 0)', () => {
      // All readings identical - SD = 0
      // J-Index = 0.001 × (Mean + 0)² = 0.001 × Mean²
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      const jIndex = calculateJIndex(readings);
      
      expect(jIndex).not.toBeNull();
      // Mean = 5.5 mmol/L = ~99 mg/dL, SD = 0
      // J-Index = 0.001 × 99² = ~9.8
      expect(jIndex!).toBeCloseTo(9.8, 0);
    });
  });

  describe('calculateMedianGlucose', () => {
    it('should return null for empty readings', () => {
      expect(calculateMedianGlucose([])).toBeNull();
    });

    it('should return the single value for one reading', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateMedianGlucose(readings)).toBe(5.5);
    });

    it('should calculate median for odd number of readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 8.0 },
      ];
      expect(calculateMedianGlucose(readings)).toBe(5.0);
    });

    it('should calculate median for even number of readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 8.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 10.0 },
      ];
      expect(calculateMedianGlucose(readings)).toBe(7.0); // (6 + 8) / 2
    });

    it('should sort values before calculating median', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 8.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 3.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.0 },
      ];
      expect(calculateMedianGlucose(readings)).toBe(5.0);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should return null for empty readings', () => {
      expect(calculateStandardDeviation([])).toBeNull();
    });

    it('should return null for single reading', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateStandardDeviation(readings)).toBeNull();
    });

    it('should return 0 for identical readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
      ];
      expect(calculateStandardDeviation(readings)).toBe(0);
    });

    it('should calculate standard deviation correctly', () => {
      // Values: 5, 6, 7 => Mean = 6, Variance = (1+0+1)/2 = 1, SD = 1
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      expect(calculateStandardDeviation(readings)).toBe(1.0);
    });
  });

  describe('calculateQuartiles', () => {
    it('should return null for empty readings', () => {
      expect(calculateQuartiles([])).toBeNull();
    });

    it('should calculate quartiles for multiple readings', () => {
      // Values sorted: 2, 4, 6, 8, 10
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 2.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 10.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 8.0 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 4.0 },
      ];
      const result = calculateQuartiles(readings);
      
      expect(result).not.toBeNull();
      expect(result!.min).toBe(2.0);
      expect(result!.max).toBe(10.0);
      expect(result!.q50).toBe(6.0); // Median
    });

    it('should include min and max values', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 3.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 7.0 },
      ];
      const result = calculateQuartiles(readings);
      
      expect(result).not.toBeNull();
      expect(result!.min).toBe(3.0);
      expect(result!.max).toBe(7.0);
    });
  });

  describe('countHighLowIncidents', () => {
    it('should return zeros for empty readings', () => {
      const result = countHighLowIncidents([], standardThresholds);
      expect(result.highCount).toBe(0);
      expect(result.lowCount).toBe(0);
      expect(result.veryHighCount).toBe(0);
      expect(result.veryLowCount).toBe(0);
    });

    it('should count transitions to high zone', () => {
      // Starts in range, goes high
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },  // inRange
        { timestamp: new Date('2024-01-15T11:00:00'), value: 11.0 }, // high
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },  // inRange
        { timestamp: new Date('2024-01-15T13:00:00'), value: 12.0 }, // high
      ];
      const result = countHighLowIncidents(readings, standardThresholds);
      expect(result.highCount).toBe(2); // Two transitions to high
    });

    it('should count transitions to low zone', () => {
      // Starts in range, goes low
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },  // inRange
        { timestamp: new Date('2024-01-15T11:00:00'), value: 3.5 },  // low
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },  // inRange
        { timestamp: new Date('2024-01-15T13:00:00'), value: 3.2 },  // low
      ];
      const result = countHighLowIncidents(readings, standardThresholds);
      expect(result.lowCount).toBe(2); // Two transitions to low
    });

    it('should count very high and very low incidents', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },  // inRange
        { timestamp: new Date('2024-01-15T11:00:00'), value: 15.0 }, // veryHigh
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },  // inRange
        { timestamp: new Date('2024-01-15T13:00:00'), value: 2.5 },  // veryLow
      ];
      const result = countHighLowIncidents(readings, standardThresholds);
      expect(result.veryHighCount).toBe(1);
      expect(result.veryLowCount).toBe(1);
    });
  });

  describe('countUnicorns', () => {
    it('should return 0 for empty readings', () => {
      expect(countUnicorns([])).toBe(0);
    });

    it('should count readings at 5.0 mmol/L', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.0 },
      ];
      expect(countUnicorns(readings)).toBe(2);
    });

    it('should count readings at 100 mg/dL (≈5.55 mmol/L)', () => {
      // 100 mg/dL = 100/18.018 ≈ 5.55 mmol/L
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.55 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.55 },
      ];
      expect(countUnicorns(readings)).toBe(2);
    });

    it('should count readings within tolerance of 100 mg/dL', () => {
      // Tolerance is 0.5 mg/dL ≈ 0.028 mmol/L
      // 100 mg/dL ≈ 5.55 mmol/L, so range is ~5.522 to ~5.578
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.53 }, // Within tolerance
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.57 }, // Within tolerance
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.50 }, // Outside tolerance (too low)
      ];
      expect(countUnicorns(readings)).toBe(2);
    });

    it('should not count 5.6 mmol/L as unicorn (outside 100 mg/dL tolerance)', () => {
      // 5.6 mmol/L is outside the ±0.5 mg/dL tolerance around 100 mg/dL (5.55)
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.6 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.6 },
      ];
      expect(countUnicorns(readings)).toBe(0);
    });

    it('should return 0 when no unicorns present', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 4.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 8.0 },
      ];
      expect(countUnicorns(readings)).toBe(0);
    });
  });

  describe('calculateFlux', () => {
    it('should return null for empty readings', () => {
      expect(calculateFlux([])).toBeNull();
    });

    it('should return null for single reading', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
      ];
      expect(calculateFlux(readings)).toBeNull();
    });

    it('should return A+ grade for very stable readings (CV ≤ 20%)', () => {
      // Very stable readings with minimal variation
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 5.5 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 5.6 },
      ];
      const result = calculateFlux(readings);
      
      expect(result).not.toBeNull();
      expect(result!.grade).toBe('A+');
    });

    it('should return F grade for very variable readings (CV > 50%)', () => {
      // Highly variable readings
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 2.5 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 10.0 },
        { timestamp: new Date('2024-01-15T12:00:00'), value: 3.0 },
        { timestamp: new Date('2024-01-15T13:00:00'), value: 15.0 },
        { timestamp: new Date('2024-01-15T14:00:00'), value: 4.0 },
      ];
      const result = calculateFlux(readings);
      
      expect(result).not.toBeNull();
      expect(result!.grade).toBe('F');
    });

    it('should include description in result', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const result = calculateFlux(readings);
      
      expect(result).not.toBeNull();
      expect(result!.description).toBeTruthy();
    });

    it('should include CV score in result', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-15T11:00:00'), value: 6.0 },
      ];
      const result = calculateFlux(readings);
      
      expect(result).not.toBeNull();
      expect(typeof result!.score).toBe('number');
    });
  });

  describe('calculateWakeupAverage', () => {
    it('should return null for empty readings', () => {
      expect(calculateWakeupAverage([])).toBeNull();
    });

    it('should return null when no readings are in wakeup time range', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 7.0 }, // 10 AM - outside range
        { timestamp: new Date('2024-01-15T14:00:00'), value: 8.0 }, // 2 PM - outside range
      ];
      expect(calculateWakeupAverage(readings)).toBeNull();
    });

    it('should calculate average for readings between 6-9 AM', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T06:00:00'), value: 6.0 }, // 6 AM
        { timestamp: new Date('2024-01-15T07:30:00'), value: 7.0 }, // 7:30 AM
        { timestamp: new Date('2024-01-15T08:45:00'), value: 8.0 }, // 8:45 AM
        { timestamp: new Date('2024-01-15T09:00:00'), value: 9.0 }, // 9 AM - outside range (9 AM is >= 9)
        { timestamp: new Date('2024-01-15T10:00:00'), value: 10.0 }, // 10 AM - outside range
      ];
      const result = calculateWakeupAverage(readings);
      expect(result).toBe(7.0); // (6 + 7 + 8) / 3
    });

    it('should handle single reading in wakeup range', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T07:00:00'), value: 5.5 },
      ];
      expect(calculateWakeupAverage(readings)).toBe(5.5);
    });
  });

  describe('calculateBedtimeAverage', () => {
    it('should return null for empty readings', () => {
      expect(calculateBedtimeAverage([])).toBeNull();
    });

    it('should return null when no readings are in bedtime range', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T10:00:00'), value: 7.0 }, // 10 AM - outside range
        { timestamp: new Date('2024-01-15T14:00:00'), value: 8.0 }, // 2 PM - outside range
        { timestamp: new Date('2024-01-15T20:00:00'), value: 9.0 }, // 8 PM - outside range
      ];
      expect(calculateBedtimeAverage(readings)).toBeNull();
    });

    it('should calculate average for readings between 9 PM - midnight', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T20:00:00'), value: 6.0 }, // 8 PM - outside range
        { timestamp: new Date('2024-01-15T21:00:00'), value: 7.0 }, // 9 PM
        { timestamp: new Date('2024-01-15T22:30:00'), value: 8.0 }, // 10:30 PM
        { timestamp: new Date('2024-01-15T23:45:00'), value: 9.0 }, // 11:45 PM
      ];
      const result = calculateBedtimeAverage(readings);
      expect(result).toBe(8.0); // (7 + 8 + 9) / 3
    });

    it('should handle single reading in bedtime range', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-15T22:00:00'), value: 6.5 },
      ];
      expect(calculateBedtimeAverage(readings)).toBe(6.5);
    });
  });
});

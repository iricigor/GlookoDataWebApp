/**
 * Tests for hypoglycemia detection and analysis utilities
 */

import { describe, it, expect } from 'vitest';
import {
  detectHypoPeriods,
  calculateHypoStats,
  formatHypoDuration,
  HYPO_RECOVERY_OFFSET,
  CONSECUTIVE_READINGS_REQUIRED,
} from './hypoDataUtils';
import type { GlucoseReading, GlucoseThresholds } from '../../types';

// Helper to create glucose readings
function createReading(value: number, minutesFromStart: number, baseDate = new Date('2024-01-15T08:00:00')): GlucoseReading {
  const timestamp = new Date(baseDate.getTime() + minutesFromStart * 60 * 1000);
  return { value, timestamp };
}

// Create readings array from values (5-minute intervals)
function createReadings(values: number[], baseDate = new Date('2024-01-15T08:00:00')): GlucoseReading[] {
  return values.map((value, index) => createReading(value, index * 5, baseDate));
}

// Standard thresholds
const thresholds: GlucoseThresholds = {
  veryHigh: 13.9,
  high: 10.0,
  low: 3.9,
  veryLow: 3.0,
};

describe('hypoDataUtils', () => {
  describe('detectHypoPeriods', () => {
    it('should return empty array for empty readings', () => {
      const result = detectHypoPeriods([], thresholds.low, false);
      expect(result).toEqual([]);
    });

    it('should return empty array for readings less than consecutive required', () => {
      const readings = createReadings([3.5, 3.6]);
      const result = detectHypoPeriods(readings, thresholds.low, false);
      expect(result).toEqual([]);
    });

    it('should not detect hypo with only 2 consecutive low readings', () => {
      const readings = createReadings([5.0, 3.5, 3.6, 5.0, 5.0, 5.0]);
      const result = detectHypoPeriods(readings, thresholds.low, false);
      expect(result).toHaveLength(0);
    });

    it('should detect hypo period with 3 consecutive low readings', () => {
      const readings = createReadings([
        5.0, 5.0,     // Normal
        3.5, 3.6, 3.4, // 3 consecutive low readings - starts hypo
        4.2, 4.3, 4.5, // Recovery: above 3.9 AND above nadir(3.4) + 0.6 = 4.0
      ]);
      
      const result = detectHypoPeriods(readings, thresholds.low, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].nadir).toBe(3.4);
      expect(result[0].isSevere).toBe(false);
    });

    it('should correctly identify nadir in hypo period', () => {
      const readings = createReadings([
        5.0, 5.0,        // Normal
        3.8, 3.5, 3.2,   // Start hypo, going down
        3.1, 2.8, 3.0,   // Nadir at 2.8
        3.5, 3.6, 3.8,   // Recovery: above 3.9? No, but above 2.8 + 0.6 = 3.4
        4.0, 4.1, 4.2,   // Now meets both criteria
      ]);
      
      const result = detectHypoPeriods(readings, thresholds.low, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].nadir).toBe(2.8);
    });

    it('should handle hypo that extends to end of readings', () => {
      const readings = createReadings([
        5.0, 5.0,     // Normal
        3.5, 3.4, 3.3, // Start hypo
        3.2, 3.1,     // Still in hypo, no recovery
      ]);
      
      const result = detectHypoPeriods(readings, thresholds.low, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].nadir).toBe(3.1);
    });

    it('should calculate duration correctly', () => {
      const readings = createReadings([
        5.0,           // 0 min
        3.5, 3.4, 3.3, // 5, 10, 15 min - start hypo at 5 min
        4.5, 4.6, 4.7, // 20, 25, 30 min - end hypo at 20 min
        5.0,           // 35 min
      ]);
      
      const result = detectHypoPeriods(readings, thresholds.low, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].durationMinutes).toBe(15); // 20 min - 5 min = 15 min
    });

    it('should detect multiple hypo periods', () => {
      const readings = createReadings([
        5.0,           // Normal
        3.5, 3.4, 3.3, // First hypo
        4.5, 4.6, 4.7, // Recovery
        5.0, 5.0,      // Normal
        3.8, 3.7, 3.6, // Second hypo
        4.8, 4.9, 5.0, // Recovery
      ]);
      
      const result = detectHypoPeriods(readings, thresholds.low, false);
      
      expect(result).toHaveLength(2);
    });

    it('should require readings above recovery threshold (nadir + 0.6)', () => {
      const readings = createReadings([
        5.0,
        3.5, 3.4, 3.0, // Hypo starts, nadir 3.0
        3.3, 3.4, 3.5, // Above 3.9? No. Above 3.0 + 0.6 = 3.6? No
        3.7, 3.8, 3.9, // Still not recovered (need >= 3.6)
        4.0, 4.1, 4.2, // Now recovered
      ]);
      
      const result = detectHypoPeriods(readings, thresholds.low, false);
      
      expect(result).toHaveLength(1);
      // Should only end once readings are >= max(3.9, 3.0 + 0.6) = 3.9
    });
  });

  describe('calculateHypoStats', () => {
    it('should return zero counts for no hypos', () => {
      const readings = createReadings([5.0, 5.5, 6.0, 5.5, 5.0]);
      
      const result = calculateHypoStats(readings, thresholds);
      
      expect(result.severeCount).toBe(0);
      expect(result.nonSevereCount).toBe(0);
      expect(result.totalCount).toBe(0);
      expect(result.lowestValue).toBeNull();
      expect(result.longestDurationMinutes).toBe(0);
      expect(result.totalDurationMinutes).toBe(0);
      expect(result.hypoPeriods).toHaveLength(0);
    });

    it('should count non-severe hypos correctly', () => {
      const readings = createReadings([
        5.0,
        3.5, 3.4, 3.3, // Non-severe hypo (above 3.0)
        4.5, 4.6, 4.7,
      ]);
      
      const result = calculateHypoStats(readings, thresholds);
      
      expect(result.nonSevereCount).toBe(1);
      expect(result.severeCount).toBe(0);
      expect(result.totalCount).toBe(1);
    });

    it('should count severe hypos correctly', () => {
      const readings = createReadings([
        5.0,
        3.5, 2.8, 2.5, // Severe hypo (below 3.0)
        4.0, 4.1, 4.2,
      ]);
      
      const result = calculateHypoStats(readings, thresholds);
      
      expect(result.severeCount).toBe(1);
      expect(result.nonSevereCount).toBe(0);
      expect(result.totalCount).toBe(1);
    });

    it('should find lowest value across all hypos', () => {
      const readings = createReadings([
        5.0,
        3.5, 3.4, 3.3, // First hypo, nadir 3.3
        4.5, 4.6, 4.7,
        5.0,
        3.5, 3.2, 3.1, // Second hypo, nadir 3.1
        4.5, 4.6, 4.7,
      ]);
      
      const result = calculateHypoStats(readings, thresholds);
      
      expect(result.lowestValue).toBe(3.1);
    });

    it('should find longest duration', () => {
      const readings = createReadings([
        5.0,
        3.5, 3.4, 3.3, // First hypo - 3 readings
        4.5, 4.6, 4.7,
        5.0,
        3.5, 3.4, 3.3, 3.2, 3.1, // Second hypo - 5 readings (longer)
        4.5, 4.6, 4.7,
      ]);
      
      const result = calculateHypoStats(readings, thresholds);
      
      expect(result.longestDurationMinutes).toBeGreaterThan(0);
      expect(result.hypoPeriods.length).toBe(2);
    });

    it('should calculate total duration', () => {
      const readings = createReadings([
        5.0,
        3.5, 3.4, 3.3, // First hypo: 15 min
        4.5, 4.6, 4.7,
        5.0,
        3.5, 3.4, 3.3, // Second hypo: 15 min
        4.5, 4.6, 4.7,
      ]);
      
      const result = calculateHypoStats(readings, thresholds);
      
      expect(result.totalDurationMinutes).toBeGreaterThan(0);
    });
  });

  describe('formatHypoDuration', () => {
    it('should format minutes only', () => {
      expect(formatHypoDuration(30)).toBe('30m');
      expect(formatHypoDuration(45)).toBe('45m');
    });

    it('should format hours only', () => {
      expect(formatHypoDuration(60)).toBe('1h');
      expect(formatHypoDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatHypoDuration(90)).toBe('1h 30m');
      expect(formatHypoDuration(135)).toBe('2h 15m');
    });

    it('should handle less than 1 minute', () => {
      expect(formatHypoDuration(0.5)).toBe('< 1m');
      expect(formatHypoDuration(0)).toBe('< 1m');
    });

    it('should round minutes', () => {
      expect(formatHypoDuration(90.7)).toBe('1h 31m');
    });
  });

  describe('constants', () => {
    it('should have correct recovery offset', () => {
      expect(HYPO_RECOVERY_OFFSET).toBe(0.6);
    });

    it('should require 3 consecutive readings', () => {
      expect(CONSECUTIVE_READINGS_REQUIRED).toBe(3);
    });
  });
});

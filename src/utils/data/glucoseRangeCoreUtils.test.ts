/**
 * Unit tests for glucose range core utilities
 */

import { describe, it, expect } from 'vitest';
import {
  categorizeGlucose,
  calculateGlucoseRangeStats,
  calculatePercentage,
  convertPercentageToTime,
} from './glucoseRangeCoreUtils';
import type { GlucoseReading, GlucoseThresholds } from '../../types';

// Standard thresholds in mmol/L
const standardThresholds: GlucoseThresholds = {
  veryLow: 3.0,
  low: 3.9,
  high: 10.0,
  veryHigh: 13.9,
};

describe('glucoseRangeCoreUtils', () => {
  describe('convertPercentageToTime', () => {
    it('should convert 25% to 6h (for 288 readings)', () => {
      // 288 readings = 24 hours at 5-minute intervals
      const result = convertPercentageToTime(288, 72);
      expect(result).toBe('6h');
    });

    it('should convert 50% to 12h (for 288 readings)', () => {
      const result = convertPercentageToTime(288, 144);
      expect(result).toBe('12h');
    });

    it('should convert 3% to 45m (for 288 readings)', () => {
      // 3% of 288 = 8.64 readings = 43.2 minutes, rounds to 45m
      const result = convertPercentageToTime(288, 9);
      expect(result).toBe('45m');
    });

    it('should display only hours when minutes are 0', () => {
      const result = convertPercentageToTime(288, 144);
      expect(result).toBe('12h');
    });

    it('should display only minutes when hours are 0', () => {
      const result = convertPercentageToTime(288, 5);
      // 5 readings * 5 min = 25 minutes
      expect(result).toBe('25m');
    });

    it('should round to nearest 5-minute interval', () => {
      // Test rounding
      const result = convertPercentageToTime(288, 14);
      // 14 readings * 5 min = 70 minutes = 1h 10m
      expect(result).toBe('1h 10m');
    });

    it('should handle 100% correctly', () => {
      const result = convertPercentageToTime(288, 288);
      expect(result).toBe('24h');
    });

    it('should handle 0% correctly', () => {
      const result = convertPercentageToTime(288, 0);
      expect(result).toBe('0m');
    });
  });

  describe('categorizeGlucose', () => {
    it('should categorize glucose in 3-category mode', () => {
      // low < 3.9 mmol/L
      expect(categorizeGlucose(3.0, standardThresholds, 3)).toBe('low');
      expect(categorizeGlucose(3.5, standardThresholds, 3)).toBe('low');
      
      // inRange: 3.9-10.0 mmol/L
      expect(categorizeGlucose(4.0, standardThresholds, 3)).toBe('inRange');
      expect(categorizeGlucose(5.5, standardThresholds, 3)).toBe('inRange');
      expect(categorizeGlucose(10.0, standardThresholds, 3)).toBe('inRange');
      
      // high > 10.0 mmol/L
      expect(categorizeGlucose(10.1, standardThresholds, 3)).toBe('high');
      expect(categorizeGlucose(14.0, standardThresholds, 3)).toBe('high');
    });

    it('should categorize glucose in 5-category mode', () => {
      // veryLow < 3.0 mmol/L
      expect(categorizeGlucose(2.5, standardThresholds, 5)).toBe('veryLow');
      expect(categorizeGlucose(2.9, standardThresholds, 5)).toBe('veryLow');
      
      // low: 3.0-3.9 mmol/L
      expect(categorizeGlucose(3.0, standardThresholds, 5)).toBe('low');
      expect(categorizeGlucose(3.8, standardThresholds, 5)).toBe('low');
      
      // inRange: 3.9-10.0 mmol/L
      expect(categorizeGlucose(4.0, standardThresholds, 5)).toBe('inRange');
      expect(categorizeGlucose(10.0, standardThresholds, 5)).toBe('inRange');
      
      // high: 10.0-13.9 mmol/L
      expect(categorizeGlucose(10.1, standardThresholds, 5)).toBe('high');
      expect(categorizeGlucose(13.0, standardThresholds, 5)).toBe('high');
      
      // veryHigh > 13.9 mmol/L
      expect(categorizeGlucose(14.0, standardThresholds, 5)).toBe('veryHigh');
      expect(categorizeGlucose(16.0, standardThresholds, 5)).toBe('veryHigh');
    });
  });

  describe('calculateGlucoseRangeStats', () => {
    it('should calculate stats for 3-category mode', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-01T10:00:00'), value: 3.3 },  // low
        { timestamp: new Date('2025-01-01T11:00:00'), value: 5.5 }, // inRange
        { timestamp: new Date('2025-01-01T12:00:00'), value: 8.3 }, // inRange
        { timestamp: new Date('2025-01-01T13:00:00'), value: 11.1 }, // high
      ];

      const stats = calculateGlucoseRangeStats(readings, standardThresholds, 3);

      expect(stats.low).toBe(1);
      expect(stats.inRange).toBe(2);
      expect(stats.high).toBe(1);
      expect(stats.total).toBe(4);
      expect(stats.veryLow).toBeUndefined();
      expect(stats.veryHigh).toBeUndefined();
    });

    it('should calculate stats for 5-category mode', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2025-01-01T10:00:00'), value: 2.8 },  // veryLow
        { timestamp: new Date('2025-01-01T11:00:00'), value: 3.3 },  // low
        { timestamp: new Date('2025-01-01T12:00:00'), value: 5.5 }, // inRange
        { timestamp: new Date('2025-01-01T13:00:00'), value: 11.1 }, // high
        { timestamp: new Date('2025-01-01T14:00:00'), value: 16.7 }, // veryHigh
      ];

      const stats = calculateGlucoseRangeStats(readings, standardThresholds, 5);

      expect(stats.veryLow).toBe(1);
      expect(stats.low).toBe(1);
      expect(stats.inRange).toBe(1);
      expect(stats.high).toBe(1);
      expect(stats.veryHigh).toBe(1);
      expect(stats.total).toBe(5);
    });

    it('should handle empty readings array', () => {
      const stats3 = calculateGlucoseRangeStats([], standardThresholds, 3);
      expect(stats3.total).toBe(0);
      expect(stats3.low).toBe(0);
      expect(stats3.inRange).toBe(0);
      expect(stats3.high).toBe(0);

      const stats5 = calculateGlucoseRangeStats([], standardThresholds, 5);
      expect(stats5.total).toBe(0);
      expect(stats5.veryLow).toBe(0);
      expect(stats5.low).toBe(0);
      expect(stats5.inRange).toBe(0);
      expect(stats5.high).toBe(0);
      expect(stats5.veryHigh).toBe(0);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25.0);
      expect(calculatePercentage(1, 3)).toBe(33.3);
      expect(calculatePercentage(2, 3)).toBe(66.7);
      expect(calculatePercentage(1, 6)).toBe(16.7);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should handle zero count', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });
  });
});

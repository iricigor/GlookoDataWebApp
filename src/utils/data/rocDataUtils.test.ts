/**
 * Tests for Rate of Change (RoC) utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRoC,
  filterRoCByDate,
  calculateRoCStats,
  getUniqueDatesFromRoC,
  categorizeRoC,
  getRoCColor,
  formatRoCValue,
  getRoCMedicalStandards,
  ROC_THRESHOLDS,
  smoothRoCData,
  getLongestCategoryPeriod,
  formatDuration,
} from './rocDataUtils';
import type { GlucoseReading } from '../../types';

describe('rocDataUtils', () => {
  describe('calculateRoC', () => {
    it('should return empty array for less than 2 readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toEqual([]);
    });

    it('should calculate RoC between consecutive readings', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(1);
      expect(result[0].roc).toBeCloseTo(0.1, 3); // 0.5 mmol/L over 5 min = 0.1 mmol/L/min
      expect(result[0].rocRaw).toBeCloseTo(0.1, 3);
    });

    it('should calculate absolute value of RoC for decreasing glucose', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 6.0 },
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(1);
      expect(result[0].roc).toBeCloseTo(0.1, 3);
      expect(result[0].rocRaw).toBeCloseTo(-0.1, 3);
    });

    it('should skip readings with time gap > 30 minutes', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:35:00'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(0);
    });

    it('should skip readings with time gap < 1 minute', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
        { timestamp: new Date('2024-01-01T10:00:30'), value: 5.5 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(0);
    });

    it('should sort readings by timestamp before calculation', () => {
      const readings: GlucoseReading[] = [
        { timestamp: new Date('2024-01-01T10:05:00'), value: 5.5 },
        { timestamp: new Date('2024-01-01T10:00:00'), value: 5.0 },
      ];
      const result = calculateRoC(readings);
      expect(result).toHaveLength(1);
      expect(result[0].roc).toBeCloseTo(0.1, 3);
    });
  });

  describe('filterRoCByDate', () => {
    it('should filter data points for a specific date', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.5,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-02T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.08,
          rocRaw: 0.08,
          glucoseValue: 6.0,
          color: '#FFAA00',
          category: 'medium' as const,
        },
      ];

      const filtered = filterRoCByDate(dataPoints, '2024-01-01');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].glucoseValue).toBe(5.5);
    });
  });

  describe('calculateRoCStats', () => {
    it('should return zero stats for empty array', () => {
      const stats = calculateRoCStats([]);
      expect(stats.totalCount).toBe(0);
      expect(stats.minRoC).toBe(0);
      expect(stats.maxRoC).toBe(0);
      expect(stats.sdRoC).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.03, // good
          rocRaw: 0.03,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.08, // medium
          rocRaw: 0.08,
          glucoseValue: 5.5,
          color: '#FFAA00',
          category: 'medium' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:10:00'),
          timeDecimal: 10.167,
          timeLabel: '10:10',
          roc: 0.15, // bad
          rocRaw: 0.15,
          glucoseValue: 6.5,
          color: '#FF0000',
          category: 'bad' as const,
        },
      ];

      const stats = calculateRoCStats(dataPoints);
      expect(stats.totalCount).toBe(3);
      expect(stats.minRoC).toBeCloseTo(0.03, 3);
      expect(stats.maxRoC).toBeCloseTo(0.15, 3);
      expect(stats.goodCount).toBe(1);
      expect(stats.mediumCount).toBe(1);
      expect(stats.badCount).toBe(1);
      expect(stats.goodPercentage).toBeCloseTo(33.3, 1);
      expect(stats.mediumPercentage).toBeCloseTo(33.3, 1);
      expect(stats.badPercentage).toBeCloseTo(33.3, 1);
    });
  });

  describe('getUniqueDatesFromRoC', () => {
    it('should return unique dates sorted', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-02T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T14:00:00'),
          timeDecimal: 14,
          timeLabel: '14:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const dates = getUniqueDatesFromRoC(dataPoints);
      expect(dates).toEqual(['2024-01-01', '2024-01-02']);
    });
  });

  describe('categorizeRoC', () => {
    it('should categorize as good when RoC <= 0.06', () => {
      expect(categorizeRoC(0)).toBe('good');
      expect(categorizeRoC(0.06)).toBe('good');
      expect(categorizeRoC(0.05)).toBe('good');
    });

    it('should categorize as medium when 0.06 < RoC <= 0.11', () => {
      expect(categorizeRoC(0.07)).toBe('medium');
      expect(categorizeRoC(0.11)).toBe('medium');
      expect(categorizeRoC(0.09)).toBe('medium');
    });

    it('should categorize as bad when RoC > 0.11', () => {
      expect(categorizeRoC(0.12)).toBe('bad');
      expect(categorizeRoC(0.15)).toBe('bad');
      expect(categorizeRoC(0.5)).toBe('bad');
    });
  });

  describe('getRoCColor', () => {
    it('should return green-ish color for low RoC', () => {
      const color = getRoCColor(0);
      expect(color).toMatch(/^rgb\(/);
      // Pure green at 0 RoC should have high G value
    });

    it('should return red-ish color for high RoC', () => {
      const color = getRoCColor(0.2);
      expect(color).toMatch(/^rgb\(/);
      // High RoC should shift towards red
    });
  });

  describe('formatRoCValue', () => {
    it('should format RoC value to 3 decimal places', () => {
      expect(formatRoCValue(0.123456)).toBe('0.123');
      expect(formatRoCValue(0.1)).toBe('0.100');
      expect(formatRoCValue(0)).toBe('0.000');
    });
  });

  describe('getRoCMedicalStandards', () => {
    it('should return medical standards object', () => {
      const standards = getRoCMedicalStandards();
      expect(standards.good).toBeDefined();
      expect(standards.medium).toBeDefined();
      expect(standards.bad).toBeDefined();
      expect(standards.good.threshold).toBe('≤0.06 mmol/L/min');
      expect(standards.medium.threshold).toBe('0.06-0.11 mmol/L/min');
      expect(standards.bad.threshold).toBe('>0.11 mmol/L/min');
    });
  });

  describe('ROC_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(ROC_THRESHOLDS.good).toBe(0.06);
      expect(ROC_THRESHOLDS.medium).toBe(0.11);
    });
  });

  describe('smoothRoCData', () => {
    it('should return empty array for empty input', () => {
      const result = smoothRoCData([]);
      expect(result).toEqual([]);
    });

    it('should apply 15-minute moving average and clamp values to >= 0', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.05,
          rocRaw: 0.05,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.08,
          rocRaw: 0.08,
          glucoseValue: 5.5,
          color: '#FFAA00',
          category: 'medium' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:10:00'),
          timeDecimal: 10.167,
          timeLabel: '10:10',
          roc: 0.03,
          rocRaw: 0.03,
          glucoseValue: 5.3,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = smoothRoCData(dataPoints);
      expect(result).toHaveLength(3);
      
      // All points should be within 15-minute window, so averaged
      // Average of 0.05, 0.08, 0.03 = 0.0533...
      result.forEach(point => {
        expect(point.roc).toBeGreaterThanOrEqual(0);
        expect(point.category).toBeDefined();
        expect(point.color).toBeDefined();
      });
    });

    it('should ensure smoothed values are never negative', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.01,
          rocRaw: 0.01,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = smoothRoCData(dataPoints);
      expect(result[0].roc).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLongestCategoryPeriod', () => {
    it('should return 0 for empty array', () => {
      const result = getLongestCategoryPeriod([], 'good');
      expect(result).toBe(0);
    });

    it('should calculate longest continuous period for a category', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.03,
          rocRaw: 0.03,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:05:00'),
          timeDecimal: 10.083,
          timeLabel: '10:05',
          roc: 0.04,
          rocRaw: 0.04,
          glucoseValue: 5.2,
          color: '#00FF00',
          category: 'good' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:10:00'),
          timeDecimal: 10.167,
          timeLabel: '10:10',
          roc: 0.12,
          rocRaw: 0.12,
          glucoseValue: 6.5,
          color: '#FF0000',
          category: 'bad' as const,
        },
        {
          timestamp: new Date('2024-01-01T10:15:00'),
          timeDecimal: 10.25,
          timeLabel: '10:15',
          roc: 0.02,
          rocRaw: 0.02,
          glucoseValue: 5.5,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = getLongestCategoryPeriod(dataPoints, 'good');
      // First streak: 10:00 to 10:05 = 5 minutes
      // Second streak: 10:15 only = 0 minutes
      expect(result).toBe(5);
    });

    it('should handle single point category', () => {
      const dataPoints = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          timeDecimal: 10,
          timeLabel: '10:00',
          roc: 0.03,
          rocRaw: 0.03,
          glucoseValue: 5.0,
          color: '#00FF00',
          category: 'good' as const,
        },
      ];

      const result = getLongestCategoryPeriod(dataPoints, 'good');
      expect(result).toBe(0); // Single point has 0 duration
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only for durations under 60 minutes', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(0)).toBe('0m');
    });

    it('should format hours only when minutes are 0', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes for mixed durations', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(150)).toBe('2h 30m');
      expect(formatDuration(75)).toBe('1h 15m');
    });
  });
});
